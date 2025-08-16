import React from 'react';
import { Container } from 'react-bootstrap';

export default function PolicyAgreement() {
  return (
    <Container className="my-5">
      <h1 className="mb-4">Platform Policy Agreement</h1>
      <p>
        Welcome to <strong>On Sale Now</strong>. As a seller on our platform, you are required to
        agree to the following policy in order to register and continue selling:
      </p>

      <ul>
        <li>
          Once your total sales reach <strong>70% of your listed stock</strong>, a platform service
          fee will become applicable.
        </li>
        <li>
          If the platform fee is not paid in a timely manner after reaching the threshold, your
          account may be <strong>temporarily blocked</strong> by the administration team.
        </li>
        <li>
          You will be notified before any blocking action is taken, and given a chance to clear any
          outstanding dues.
        </li>
      </ul>

      <p>
        This policy is in place to ensure fair use of our platform and to support continued
        improvements to seller tools and marketing reach.
      </p>

      <p className="mt-4">
        By checking the policy agreement box during registration, you acknowledge and agree to
        these terms.
      </p>
    </Container>
  );
}
