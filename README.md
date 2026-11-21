# Kingscare Hospital & NIMASA Patient-Tracking System (Clickable Front-End Mockup)

**Client:** Kingscare Hospital (Abuja, Nigeria) & Sponsor Body **NIMASA** (Nigerian Maritime Administration and Safety Agency)  
**Built by:** Angel Tech & Media Limited  
**Notice:** This is a clickable front-end prototype powered by shared in-memory React state and 100% fictional Nigerian clinical data.

---

## How to Run Locally

```bash
cd c:\Users\UDSER\Desktop\kingscare-mockup
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## List of Screens & Routes

Use the **"Demo mode role switcher"** in the top-right bar on any page to jump immediately between roles without logging in:

1. **Login (`/login`)**
   - Two entry cards: **Hospital staff** (with role selector for Front Desk, Doctor, Lab, Radiology, Admin) and **NIMASA** sponsor portal.
2. **NIMASA Portal — Dashboard (`/nimasa`)**
   - Kingscare Abuja facility card + stylised Abuja map preview.
   - 4 KPI tiles: *Total NIMASA Registered*, *In Hospital Now (Active)*, *Discharged (Inactive)*, and *Today's Count vs Daily Quota (`14 / 20`)* with progress bar.
   - Searchable, filterable patient directory table (`Record no.`, `Name`, `Current stage`, `Location now`, `Time in hospital`, `Active/Inactive`).
3. **NIMASA Portal — Patient Stage Timeline (`/nimasa/patients/:recordNo`)**
   - Horizontal 8-stage timeline (`Registered`, `Awaiting doctor`, `In assessment`, `First assessment complete`, `Tests requested / Admitted`, `Results ready`, `Second assessment`, `Discharged`) with timestamps, responsible staff role, and interactive hover tooltips.
   - Displays confidentiality notice: *"Full clinical notes are held by Kingscare"*.
4. **NIMASA Portal — Sponsor Reports (`/nimasa/reports`)**
   - Visual bar charts for **Patients per Day** vs daily quota and **Average Time per Stage** vs SLA benchmark.
5. **Hospital: Front Desk (`/front-desk`)**
   - Patient search, **Register New Patient** form (captures NIMASA membership & consent checkbox, auto-generates `KC-0001XX` record numbers), and **Today's Arrivals** list with one-click **"Send to doctor"**.
6. **Hospital: Doctor — My Patients (`/doctor`)**
   - Queue tabs: `Awaiting me`, `In assessment`, `Results ready`, and `All Active in Hospital`.
7. **Hospital: Doctor — Patient Clinical Workspace (`/doctor/patients/:recordNo`)**
   - Patient identity header, vitals strip, and 5 tabs: `Summary`, `Notes & Discharge`, `Orders`, `Results`, `Trail`.
   - Includes First Assessment form (`Mark first assessment complete`), **Send for tests** modal (*Blood, Stool, Tissue, Imaging*), **Admit patient**, Results notification banner (`Results available: ...`), Second assessment, Medication prescriber, and **Discharge with summary**.
8. **Hospital: Laboratory (`/lab`) & Radiology (`/radiology`)**
   - Shared diagnostic workbench filtered by department.
   - Displays pending & draft test orders with separate **"Save draft"** and **"Publish result"** buttons.
   - Enforces clinical privacy: doctor's consultation notes are hidden from Lab/Radiology staff.
9. **Hospital: Admin — Master File (`/admin`), Users (`/admin/users`), Audit Log (`/admin/audit`)**
   - **Master File:** Department cards for *Laboratory*, *Radiology / X-ray*, *ENT / Audiology*, and *Eye Clinic* showing Head of Department qualifications, staff roster, equipment table (name, model, year of make), and certificates table (`Valid`, `Expiring`, `Expired`).
   - **Users & Roles:** Staff and NIMASA liaison account table.
   - **Audit Log:** Real-time electronic trail (`Who`, `Role`, `Action`, `Record`, `Time`) updated live whenever any button is clicked across the app.
