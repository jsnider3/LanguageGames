// ═══════════════════════════════════════════════════════════
// NoteManager.js — Rhythm note loading, state tracking, and
//                  hit detection for NeonPulse
// ═══════════════════════════════════════════════════════════

import { TIMING, LANE_COUNT, NOTE_TYPES, HIT_ZONE_Y, SCROLL_SPEED } from './Constants.js';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

/** How long a missed tap remains visible for fade-out (seconds) */
const MISS_FADE_DURATION = 0.3;

/** Extra time buffer (seconds) beyond the computed viewport edges */
const VISIBILITY_BUFFER = 0.5;

// ═══════════════════════════════════════════════════════════
// NOTE MANAGER CLASS
// ═══════════════════════════════════════════════════════════

export class NoteManager {

    // -------------------------------------------------------
    // Construction
    // -------------------------------------------------------

    constructor() {
        /** @type {Array<Object>} All notes for the current chart */
        this.notes = [];

        /**
         * Optimization index — points to the first note in the array
         * that has not yet been hit or missed, so we can skip already-
         * resolved notes when scanning.
         */
        this.nextNoteIndex = 0;

        /** Beats per minute of the current song */
        this.bpm = 120;

        /** Total duration of the current song in seconds */
        this.songDuration = 0;
    }

    // -------------------------------------------------------
    // Chart Loading
    // -------------------------------------------------------

    /**
     * Parse a chart definition and populate the internal notes array.
     *
     * @param {Object}  chart           Chart data object
     * @param {Array}   chart.notes     Array of note tuples:
     *                                    [beat, lane, 'tap']
     *                                    [beat, lane, 'hold', endBeat]
     * @param {number}  bpm             Song tempo
     * @param {number}  songDuration    Song length in seconds
     */
    loadChart(chart, bpm, songDuration) {
        this.bpm = bpm;
        this.songDuration = songDuration;

        const beatToTime = (beat) => beat * 60 / this.bpm;

        this.notes = chart.notes.map(entry => {
            const [beat, lane, type, endBeat = null] = entry;
            const isHold = type === NOTE_TYPES.HOLD || type === 'hold';

            return {
                beat,
                lane,
                type: isHold ? NOTE_TYPES.HOLD : NOTE_TYPES.TAP,
                time: beatToTime(beat),
                endBeat: isHold ? endBeat : null,
                endTime: isHold && endBeat !== null ? beatToTime(endBeat) : null,

                // State flags
                hit: false,
                missed: false,
                judgement: null,       // 'perfect' | 'great' | 'good' | 'miss'

                // Hold-specific state
                holdActive: false,     // currently being held down
                holdCompleted: false,  // successfully held to the end
                holdDropped: false     // released too early
            };
        });

        // Sort by time ascending (stable for notes on the same beat)
        this.notes.sort((a, b) => a.time - b.time);

        this.nextNoteIndex = 0;
    }

    // -------------------------------------------------------
    // Per-Frame Update
    // -------------------------------------------------------

    /**
     * Advance note state for the current frame.
     *
     * - Flags notes that have fallen past all timing windows as missed.
     * - Completes hold notes whose end time has been reached.
     * - Advances the scan index past resolved notes.
     *
     * @param  {number} songTime  Current playback time in seconds
     * @return {{ missedNotes: Array<Object> }}
     */
    update(songTime) {
        const missedNotes = [];

        // --- Check for missed notes ---
        for (let i = this.nextNoteIndex; i < this.notes.length; i++) {
            const note = this.notes[i];

            // Once we reach notes still within the miss window we can stop
            if (note.time > songTime + TIMING.MISS_WINDOW) break;

            // Skip notes that are already resolved
            if (note.hit || note.missed) continue;

            // Note has passed beyond the miss window — mark it
            if (songTime > note.time + TIMING.MISS_WINDOW) {
                note.missed = true;
                note.judgement = 'miss';
                missedNotes.push(note);
            }
        }

        // --- Complete active hold notes that have reached their end ---
        for (let i = this.nextNoteIndex; i < this.notes.length; i++) {
            const note = this.notes[i];

            // No need to scan past the current time horizon
            if (note.time > songTime + TIMING.MISS_WINDOW) break;

            if (note.type === NOTE_TYPES.HOLD && note.holdActive && songTime >= note.endTime) {
                note.holdCompleted = true;
                note.holdActive = false;
            }
        }

        // --- Advance nextNoteIndex past all fully resolved notes ---
        while (this.nextNoteIndex < this.notes.length) {
            const note = this.notes[this.nextNoteIndex];
            if (note.hit || note.missed) {
                // For hold notes, only advance once the hold itself is resolved
                if (note.type === NOTE_TYPES.HOLD && note.hit &&
                    !note.holdCompleted && !note.holdDropped) {
                    break;
                }
                this.nextNoteIndex++;
            } else {
                break;
            }
        }

        return { missedNotes };
    }

    // -------------------------------------------------------
    // Hit Detection
    // -------------------------------------------------------

    /**
     * Attempt to register a hit on the closest unhit note in a lane.
     *
     * @param  {number} lane      Lane index (0 – LANE_COUNT-1)
     * @param  {number} songTime  Current playback time in seconds
     * @return {{ hit: boolean, judgement: string|null, note: Object|null }}
     */
    checkHit(lane, songTime) {
        let bestNote = null;
        let bestDelta = Infinity;

        // Search from the optimization index forward
        for (let i = this.nextNoteIndex; i < this.notes.length; i++) {
            const note = this.notes[i];

            // Past the point where any note could be within the miss window
            if (note.time > songTime + TIMING.MISS_WINDOW) break;

            // Skip notes not in this lane or already resolved
            if (note.lane !== lane) continue;
            if (note.hit || note.missed) continue;

            const delta = Math.abs(note.time - songTime);
            if (delta > TIMING.MISS_WINDOW) continue;

            // Track the closest note by time difference
            if (delta < bestDelta) {
                bestDelta = delta;
                bestNote = note;
            }
        }

        // No candidate found
        if (!bestNote) {
            return { hit: false, judgement: null, note: null };
        }

        // Determine judgement from timing delta
        const judgement = this._getJudgement(bestDelta);

        if (judgement === null) {
            // Within the miss window but outside any positive hit window
            return { hit: false, judgement: null, note: null };
        }

        // Register the hit
        bestNote.hit = true;
        bestNote.judgement = judgement;

        // Activate hold tracking for hold notes
        if (bestNote.type === NOTE_TYPES.HOLD) {
            bestNote.holdActive = true;
        }

        return { hit: true, judgement, note: bestNote };
    }

    // -------------------------------------------------------
    // Hold Release Detection
    // -------------------------------------------------------

    /**
     * Handle a key release in a lane that may contain an active hold note.
     *
     * @param  {number} lane      Lane index
     * @param  {number} songTime  Current playback time in seconds
     * @return {{ completed: boolean, dropped: boolean, note: Object|null }}
     */
    checkHoldRelease(lane, songTime) {
        // Find the active hold in this lane
        const note = this._findActiveHold(lane);

        if (!note) {
            return { completed: false, dropped: false, note: null };
        }

        // Was the key released close enough to the end of the hold?
        if (songTime >= note.endTime - TIMING.GOOD) {
            note.holdCompleted = true;
            note.holdActive = false;
            return { completed: true, dropped: false, note };
        }

        // Released too early — drop it
        note.holdDropped = true;
        note.holdActive = false;
        return { completed: false, dropped: true, note };
    }

    // -------------------------------------------------------
    // Visibility
    // -------------------------------------------------------

    /**
     * Return the subset of notes that should be drawn on screen
     * given the current song time.
     *
     * @param  {number}        songTime  Current playback time
     * @return {Array<Object>}           Visible note objects
     */
    getVisibleNotes(songTime) {
        // Time range that maps to the visible portion of the playfield
        const earlyEdge = songTime - VISIBILITY_BUFFER;
        const lateEdge  = songTime + (HIT_ZONE_Y / SCROLL_SPEED) + VISIBILITY_BUFFER;

        const visible = [];

        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];

            // --- Determine temporal bounds of this note ---
            const noteStart = note.time;
            const noteEnd   = (note.type === NOTE_TYPES.HOLD && note.endTime !== null)
                ? note.endTime
                : noteStart;

            // Quick reject: entirely before or after the viewport
            if (noteEnd < earlyEdge) {
                // Hold notes that extend past earlyEdge should still be shown
                if (note.type !== NOTE_TYPES.HOLD) {
                    // Tap note: might still be in miss-fade range
                    if (note.missed && songTime - note.time <= MISS_FADE_DURATION) {
                        visible.push(note);
                    }
                    continue;
                }
                // Hold that ended before earlyEdge — skip
                continue;
            }
            if (noteStart > lateEdge) {
                // Notes are sorted by time, so nothing after this matters
                break;
            }

            // --- Filter by note state ---

            // Tap notes that were hit disappear instantly
            if (note.type === NOTE_TYPES.TAP && note.hit) continue;

            // Missed taps stay briefly for fade-out
            if (note.type === NOTE_TYPES.TAP && note.missed) {
                if (songTime - note.time > MISS_FADE_DURATION) continue;
            }

            visible.push(note);
        }

        return visible;
    }

    // -------------------------------------------------------
    // Statistics Helpers
    // -------------------------------------------------------

    /**
     * @return {number} Total number of notes in the loaded chart
     */
    getTotalNotes() {
        return this.notes.length;
    }

    /**
     * @return {number} Number of successfully resolved notes
     *                  (taps hit + holds completed)
     */
    getHitCount() {
        let count = 0;
        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note.hit || note.holdCompleted) count++;
        }
        return count;
    }

    // -------------------------------------------------------
    // Reset
    // -------------------------------------------------------

    /**
     * Clear all note data and reset scanning state.
     */
    reset() {
        this.notes = [];
        this.nextNoteIndex = 0;
    }

    // -------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------

    /**
     * Map an absolute timing delta (seconds) to a judgement string.
     *
     * @param  {number}      delta  Absolute time difference
     * @return {string|null}        Judgement or null if outside all windows
     * @private
     */
    _getJudgement(delta) {
        if (delta <= TIMING.PERFECT) return 'perfect';
        if (delta <= TIMING.GREAT)   return 'great';
        if (delta <= TIMING.GOOD)    return 'good';
        return null;
    }

    /**
     * Find a hold note in the given lane that is currently active.
     *
     * @param  {number}      lane
     * @return {Object|null} The active hold note, or null
     * @private
     */
    _findActiveHold(lane) {
        for (let i = this.nextNoteIndex; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note.type === NOTE_TYPES.HOLD && note.lane === lane && note.holdActive) {
                return note;
            }
        }
        return null;
    }
}
