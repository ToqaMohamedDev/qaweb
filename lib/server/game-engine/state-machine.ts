/**
 * Game State Machine
 * Manages game state transitions with validation
 */

import type { RoomStatus } from '../types/index';

// Valid state transitions
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
    'CREATED': ['WAITING', 'ARCHIVED'],
    'WAITING': ['STARTING', 'ARCHIVED'],
    'STARTING': ['ACTIVE', 'WAITING', 'ARCHIVED'],
    'ACTIVE': ['QUESTION_ACTIVE', 'PAUSED', 'ENDED'],
    'QUESTION_ACTIVE': ['QUESTION_CLOSED', 'PAUSED', 'ENDED'],
    'QUESTION_CLOSED': ['SHOWING_RESULTS', 'ENDED'],
    'SHOWING_RESULTS': ['QUESTION_ACTIVE', 'ENDED'],
    'PAUSED': ['QUESTION_ACTIVE', 'ACTIVE', 'ENDED'],
    'ENDED': ['ARCHIVED'],
    'ARCHIVED': [],
};

export interface StateTransitionContext {
    roomId: string;
    currentState: RoomStatus;
    targetState: RoomStatus;
    initiatedBy: string;
    reason?: string;
    timestamp: number;
}

export interface StateTransitionResult {
    success: boolean;
    previousState: RoomStatus;
    newState: RoomStatus;
    error?: string;
}

export class GameStateMachine {
    private currentState: RoomStatus;
    private stateHistory: Array<{ state: RoomStatus; timestamp: number; reason?: string }> = [];
    private listeners: Map<string, Set<(context: StateTransitionContext) => void>> = new Map();

    constructor(initialState: RoomStatus = 'CREATED') {
        this.currentState = initialState;
        this.stateHistory.push({
            state: initialState,
            timestamp: Date.now(),
            reason: 'Initial state',
        });
    }

    /**
     * Get current state
     */
    getState(): RoomStatus {
        return this.currentState;
    }

    /**
     * Get state history
     */
    getHistory(): Array<{ state: RoomStatus; timestamp: number; reason?: string }> {
        return [...this.stateHistory];
    }

    /**
     * Check if a transition is valid
     */
    canTransitionTo(targetState: RoomStatus): boolean {
        const allowedTransitions = STATE_TRANSITIONS[this.currentState];
        return allowedTransitions?.includes(targetState) ?? false;
    }

    /**
     * Get allowed transitions from current state
     */
    getAllowedTransitions(): RoomStatus[] {
        return STATE_TRANSITIONS[this.currentState] ?? [];
    }

    /**
     * Attempt to transition to a new state
     */
    transition(
        targetState: RoomStatus,
        context: Omit<StateTransitionContext, 'currentState' | 'targetState' | 'timestamp'>
    ): StateTransitionResult {
        const previousState = this.currentState;

        if (!this.canTransitionTo(targetState)) {
            return {
                success: false,
                previousState,
                newState: previousState,
                error: `Invalid transition from ${previousState} to ${targetState}. Allowed: ${this.getAllowedTransitions().join(', ')}`,
            };
        }

        // Perform transition
        this.currentState = targetState;
        const timestamp = Date.now();

        // Record in history
        this.stateHistory.push({
            state: targetState,
            timestamp,
            reason: context.reason,
        });

        // Notify listeners
        const fullContext: StateTransitionContext = {
            ...context,
            currentState: previousState,
            targetState,
            timestamp,
        };

        this.notifyListeners(targetState, fullContext);
        this.notifyListeners('*', fullContext); // Wildcard listeners

        return {
            success: true,
            previousState,
            newState: targetState,
        };
    }

    /**
     * Force transition (for admin override or recovery)
     */
    forceTransition(
        targetState: RoomStatus,
        context: Omit<StateTransitionContext, 'currentState' | 'targetState' | 'timestamp'>
    ): StateTransitionResult {
        const previousState = this.currentState;
        this.currentState = targetState;
        const timestamp = Date.now();

        this.stateHistory.push({
            state: targetState,
            timestamp,
            reason: `FORCED: ${context.reason}`,
        });

        const fullContext: StateTransitionContext = {
            ...context,
            currentState: previousState,
            targetState,
            timestamp,
        };

        this.notifyListeners(targetState, fullContext);
        this.notifyListeners('*', fullContext);

        return {
            success: true,
            previousState,
            newState: targetState,
        };
    }

    /**
     * Add listener for state transitions
     */
    onTransition(
        state: RoomStatus | '*',
        callback: (context: StateTransitionContext) => void
    ): () => void {
        if (!this.listeners.has(state)) {
            this.listeners.set(state, new Set());
        }
        this.listeners.get(state)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(state)?.delete(callback);
        };
    }

    /**
     * Notify listeners of state change
     */
    private notifyListeners(state: RoomStatus | '*', context: StateTransitionContext): void {
        const callbacks = this.listeners.get(state);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(context);
                } catch (error) {
                    console.error(`Error in state transition listener for ${state}:`, error);
                }
            }
        }
    }

    /**
     * Check if in a specific state
     */
    isIn(state: RoomStatus): boolean {
        return this.currentState === state;
    }

    /**
     * Check if in any of the given states
     */
    isInAny(...states: RoomStatus[]): boolean {
        return states.includes(this.currentState);
    }

    /**
     * Check if game is playable (questions can be shown)
     */
    isPlayable(): boolean {
        return this.isInAny('ACTIVE', 'QUESTION_ACTIVE', 'QUESTION_CLOSED', 'SHOWING_RESULTS');
    }

    /**
     * Check if game is accepting answers
     */
    isAcceptingAnswers(): boolean {
        return this.isIn('QUESTION_ACTIVE');
    }

    /**
     * Serialize state for persistence
     */
    serialize(): { currentState: RoomStatus; history: Array<{ state: RoomStatus; timestamp: number; reason?: string }> } {
        return {
            currentState: this.currentState,
            history: [...this.stateHistory],
        };
    }

    /**
     * Restore from serialized state
     */
    static deserialize(data: { currentState: RoomStatus; history: Array<{ state: RoomStatus; timestamp: number; reason?: string }> }): GameStateMachine {
        const machine = new GameStateMachine(data.currentState);
        machine.stateHistory = [...data.history];
        return machine;
    }
}

/**
 * State machine for individual question lifecycle
 */
export type QuestionState = 'IDLE' | 'SHOWING' | 'ACTIVE' | 'CLOSED' | 'RESULTS';

const QUESTION_TRANSITIONS: Record<QuestionState, QuestionState[]> = {
    'IDLE': ['SHOWING'],
    'SHOWING': ['ACTIVE'],
    'ACTIVE': ['CLOSED'],
    'CLOSED': ['RESULTS'],
    'RESULTS': ['IDLE'],
};

export class QuestionStateMachine {
    private currentState: QuestionState = 'IDLE';
    private questionId: string | null = null;
    private questionIndex: number = -1;

    getState(): QuestionState {
        return this.currentState;
    }

    getCurrentQuestionId(): string | null {
        return this.questionId;
    }

    getCurrentQuestionIndex(): number {
        return this.questionIndex;
    }

    canTransitionTo(targetState: QuestionState): boolean {
        return QUESTION_TRANSITIONS[this.currentState]?.includes(targetState) ?? false;
    }

    startQuestion(questionId: string, questionIndex: number): boolean {
        if (this.currentState !== 'IDLE') {
            return false;
        }
        this.questionId = questionId;
        this.questionIndex = questionIndex;
        this.currentState = 'SHOWING';
        return true;
    }

    activateQuestion(): boolean {
        if (!this.canTransitionTo('ACTIVE')) return false;
        this.currentState = 'ACTIVE';
        return true;
    }

    closeQuestion(): boolean {
        if (!this.canTransitionTo('CLOSED')) return false;
        this.currentState = 'CLOSED';
        return true;
    }

    showResults(): boolean {
        if (!this.canTransitionTo('RESULTS')) return false;
        this.currentState = 'RESULTS';
        return true;
    }

    reset(): void {
        this.currentState = 'IDLE';
        this.questionId = null;
        this.questionIndex = -1;
    }

    isAcceptingAnswers(): boolean {
        return this.currentState === 'ACTIVE';
    }
}
