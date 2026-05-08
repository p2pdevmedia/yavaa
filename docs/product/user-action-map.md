# User Action Map

This document defines what each user type can do in Yavaa.

It should be used as a reference for:

- UI navigation
- backend permissions
- API authorization
- testing
- product planning

---

# User types

- Guest
- Client
- Contractor
- Admin
- Support

A single user account can have multiple roles.

The app must show different modes depending on the active role.

---

# Guest

A guest is a user who is not logged in.

## Can do

- View landing page
- Search basic public categories
- View limited public provider information
- Create account
- Log in

## Cannot do

- Create bookings
- Request emergencies
- Chat
- Rate providers
- View private provider data
- Upload payment proofs

---

# Client

A client is a user looking for help.

## Search and discovery

- Search by category
- Search by location
- Filter providers
- View provider profiles
- View ratings
- View availability
- View emergency availability

## Booking

- Create scheduled booking
- Create emergency request
- Add address
- Add description
- Upload problem photos
- Cancel booking
- Request reschedule
- View booking status
- View booking history

## Chat

- Chat with assigned contractor
- Send text messages
- Send images
- View system messages

## Completion and ratings

- Confirm completed work
- Report incomplete work
- Rate contractor
- Leave review comment
- Report contractor no-show

## Debt and payments

- View debt balance
- View debt limit
- Upload payment proof
- View payment proof status

## Profile

- Edit personal profile
- Manage addresses
- Switch to contractor mode if role exists

## Cannot do

- Accept contractor jobs
- See other clients private data
- Access admin panel
- Validate payment proofs
- Moderate providers

---

# Contractor

A contractor is a provider offering services.

## Profile

- Create contractor profile
- Edit contractor profile
- Upload profile photo
- Configure service area
- Add experience description
- Submit profile for approval

## Services

- Create services
- Edit services
- Pause services
- Delete or archive services
- Set price type
- Set estimated duration
- Enable emergency service
- Configure emergency price

## Availability

- Configure weekly schedule
- Add blocked times
- Remove blocked times
- Pause availability
- Enable or disable emergency availability

## Bookings

- View incoming booking requests
- Accept scheduled booking
- Reject scheduled booking
- Propose reschedule
- View assigned bookings
- Mark as on the way
- Mark as started
- Mark as completed
- Report client no-show

## Emergencies

- Receive emergency notifications
- Accept emergency request
- Ignore emergency request
- Disable emergency mode

## Chat

- Chat with assigned client
- Send text messages
- Send images
- View system messages

## Ratings

- View received ratings
- View review history
- Reply to review if product allows it

## Debt and payments

- View debt balance
- View debt limit
- Upload payment proof
- View proof review status

## Profile switching

- Switch to client mode

## Cannot do

- Approve own profile
- Validate own payment proof
- Remove bad ratings directly
- Access admin panel unless admin role exists
- See private data from unrelated bookings

---

# Admin

Admin is a web-only operational role.

## User management

- View users
- Search users
- Edit basic user data
- Suspend users
- Reactivate users
- Assign roles
- Remove roles
- View user debt
- View user booking history

## Contractor management

- Review contractor applications
- Approve contractor
- Reject contractor
- Suspend contractor
- Reactivate contractor
- Edit contractor categories
- Review provider reputation

## Category and service management

- Create categories
- Edit categories
- Disable categories
- Set category rules
- Set default commission rules

## Booking management

- View all bookings
- Filter bookings by status
- Reassign booking
- Cancel booking
- Force status correction
- View booking timeline
- View booking chat when needed

## Emergency operations

- View active emergencies
- Monitor matching status
- Manually assign contractor
- Close unresolved emergency

## Debt and commission management

- Configure commission rules
- View generated debts
- Adjust debt manually
- Cancel incorrect debt
- Set debt limits
- Block users by debt
- Unblock users after payment

## Payment proof validation

- View payment proofs
- Approve proof
- Reject proof
- Add admin comment
- Allocate payment to one or many debts

## Disputes

- View disputes
- Review chat history
- Review booking evidence
- Decide dispute outcome
- Apply penalties
- Close dispute

## Reviews and moderation

- Moderate reviews
- Hide abusive reviews
- Flag suspicious reviews
- Track low-quality contractors

## Cannot do

- Act as a contractor unless the account also has contractor role
- Act as a client unless the account also has client role
- Delete audit history

---

# Support

Support is an internal limited role.

## Can do

- View users
- View bookings
- View booking status
- View limited chat history when needed
- Create support notes
- Help with disputes
- Escalate to admin

## Cannot do

- Approve contractors
- Change commission rules
- Validate payment proofs
- Delete users
- Change debt balances
- Assign roles

---

# Cross-role rules

## One account, multiple modes

A user can have multiple roles.

Example:

- client + contractor
- contractor + admin
- client + admin

The UI changes by active mode.

Backend permissions must always check roles, not only UI state.

## Active mode

The app should store an active mode such as:

- client
- contractor
- admin
- support

Changing active mode changes:

- navigation
- dashboard
- available actions
- default routes

It does not change the underlying user identity.

---

# Permission principle

Every action must answer:

1. Who is trying to do this?
2. Which role are they using?
3. Are they allowed to act on this resource?
4. Is the resource related to them?
5. Are they blocked by debt or suspension?

---

# Important test requirement

Every action in this document should eventually have at least one permission test.
