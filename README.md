# Bex Project Catalogue

A responsive project catalogue for showcasing completed Bex digital products, internal tools, dashboards, automation projects, and web applications.

## Overview

The Bex Project Catalogue provides a public catalogue of completed projects with screenshots, descriptions, technology stacks, GitHub links, and live application links.

It also includes a secure admin dashboard for managing project records, screenshots, visibility, and display order.

## Features

* Responsive public project catalogue
* Search and sort projects
* Project screenshot preview modal
* Multi-image screenshot gallery
* Image fallback for missing or broken screenshots
* Skeleton loading state
* GitHub and live application links
* Secure admin login
* Add and edit project records
* Upload and manage project screenshots
* Manage project status and display order
* Recycle bin with restore and permanent delete options
* Bulk project actions
* Forgot password and password reset flow
* Remember-me email option

## Tech Stack

* HTML5
* CSS3
* Bootstrap 5
* Bootstrap Icons
* JavaScript
* Supabase Auth
* Supabase Database
* Supabase Storage

## Project Structure

```text
bex-project-catalogue/
├── assets/
│   ├── css/
│   ├── icons/
│   ├── images/
│   └── js/
├── admin.html
├── index.html
├── projects.json
└── README.md
```

## Public Catalogue

The public catalogue is available from `index.html`.

Only active completed projects are shown publicly. In-progress projects can be managed from the admin dashboard but are hidden from the public catalogue.

## Admin Dashboard

The admin dashboard is available from `admin.html`.

Authorised users can sign in to add, edit, hide, restore, and delete project records. Screenshot uploads are stored in Supabase Storage, while project data is managed through Supabase tables.

## Local Setup

1. Clone the repository.

```bash
git clone <repository-url>
cd bex-project-catalogue
```

2. Confirm the Supabase configuration exists.

```text
assets/js/supabase-config.js
```

3. Run the project with a local server, such as VS Code Live Server.

4. Open the public catalogue.

```text
http://127.0.0.1:5500/index.html
```

5. Open the admin dashboard.

```text
http://127.0.0.1:5500/admin.html
```

## Deployment

The project is ready for static deployment on platforms such as Vercel.

Before deployment, confirm:

* Supabase project URL and anon key are correct
* Supabase Auth redirect URLs include the deployed admin URL
* Supabase Storage bucket is configured
* Admin user access is set up
* Public and admin smoke tests pass

## Status

Ready for final smoke testing, Git commit, GitHub push, and deployment.
