import posthog from 'posthog-js';

/**
 * Analytics tracking utilities for Oposita+
 * All tracking events follow PostHog best practices
 */

type UserSignupProps = {
  userId: string;
  email: string;
  provider?: 'email' | 'google' | 'other';
};

type TestEvent = {
  userId: string;
  testId: string;
  testType: 'practice' | 'exam' | 'custom';
  subject?: string;
};

type TestCompletedProps = TestEvent & {
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
};

type TutorInteractionProps = {
  userId: string;
  interactionType: 'question' | 'explanation' | 'hint';
  topic?: string;
};

type ActivationMilestoneProps = {
  userId: string;
  milestone:
    | 'first_test'
    | 'first_week'
    | 'first_tutor_use'
    | 'first_plan_created'
    | 'first_study_session';
};

export const analytics = {
  /**
   * Track user signup
   */
  userSignup(props: UserSignupProps) {
    posthog.capture('user_signup', {
      user_id: props.userId,
      email: props.email,
      provider: props.provider || 'email',
      $set: {
        email: props.email,
        signup_date: new Date().toISOString(),
      },
    });
    posthog.identify(props.userId, {
      email: props.email,
    });
  },

  /**
   * Track test started
   */
  testStarted(props: TestEvent) {
    posthog.capture('test_started', {
      user_id: props.userId,
      test_id: props.testId,
      test_type: props.testType,
      subject: props.subject,
    });
  },

  /**
   * Track test completed
   */
  testCompleted(props: TestCompletedProps) {
    posthog.capture('test_completed', {
      user_id: props.userId,
      test_id: props.testId,
      test_type: props.testType,
      subject: props.subject,
      score: props.score,
      total_questions: props.totalQuestions,
      time_spent_seconds: props.timeSpentSeconds,
      pass_rate: (props.score / props.totalQuestions) * 100,
    });
  },

  /**
   * Track tutor interaction
   */
  tutorInteraction(props: TutorInteractionProps) {
    posthog.capture('tutor_interaction', {
      user_id: props.userId,
      interaction_type: props.interactionType,
      topic: props.topic,
    });
  },

  /**
   * Track activation milestone
   */
  activationMilestone(props: ActivationMilestoneProps) {
    posthog.capture('activation_milestone', {
      user_id: props.userId,
      milestone: props.milestone,
      $set: {
        [`milestone_${props.milestone}`]: new Date().toISOString(),
      },
    });
  },

  /**
   * Identify user with additional properties
   */
  identify(userId: string, properties?: Record<string, any>) {
    posthog.identify(userId, properties);
  },

  /**
   * Reset analytics (e.g., on logout)
   */
  reset() {
    posthog.reset();
  },
};
