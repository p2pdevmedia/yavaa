# Agent Friendly Platform

Yavaa must be designed for humans and AI agents.

A person may ask an agent to:

- find a contractor
- compare providers
- create a booking request
- offer a service
- manage availability

Yavaa should support this from the beginning.

## Principle

Every important action should be possible through:

1. Human UI
2. API contract
3. Future agent workflow

## API-first

Yavaa must be API-first.

OpenAPI is mandatory.

The web app, mobile apps, tests, and future agents should rely on the same product contract.

## Client agent use cases

An agent should eventually help a client:

- search providers
- filter by category, location, urgency, rating, price, and availability
- create a request
- compare contractor responses
- ask the user for confirmation
- book the selected contractor
- track booking status

## Contractor agent use cases

An agent should eventually help a contractor:

- create a contractor profile
- create services
- configure availability
- update prices
- pause services
- review incoming requests

## Confirmation rule

Agents must not finalize sensitive actions without user confirmation.

Sensitive actions include:

- booking a service
- cancelling a booking
- accepting a final price
- uploading payment proof
- sending personal data
- opening a dispute

## UI requirement

The UI must be simple for humans and predictable for agents and Playwright tests.

Important screens should have:

- stable routes
- clear labels
- accessible forms
- predictable states
- semantic HTML

## Product direction

Yavaa should become a trusted service network where people and agents can safely coordinate real-world services.
