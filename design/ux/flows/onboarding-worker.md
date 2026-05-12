# Worker Onboarding Flow

## Goal

Allow a worker to create a verified profile in less than 2 minutes.

---

# Step 1 — Name

Fields:
- Name
- Last name

Validation:
- required
- max 40 chars

---

# Step 2 — DNI

Fields:
- DNI number

Validation:
- numeric only
- valid argentina DNI length

---

# Step 3 — DNI Photos

Required:
- front photo
- back photo

Accepted:
- jpg
- png
- heic

---

# Step 4 — Address

Features:
- map pin
- draggable pin
- GPS autofill
- autocomplete address

---

# Step 5 — Categories

Multi-select categories:
- construction
- cleaning
- classes
- plumbing
- gardening
- painting
- moving

---

# Step 6 — Hourly Price

Fields:
- hourly price

Validation:
- required
- numeric only
- greater than 0

UX:
- show currency as ARS
- explain that the worker can change it later
- keep it as a suggested base rate, not a final quote

---

# Success

Show:
- verification pending
- nearby jobs
- trust badges
