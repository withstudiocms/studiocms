---
"studiocms": patch
---

Remove old `testingAndDemoMode` developer option and add new `demoMode` option with a simple interface

Demo mode can either be `false` or an object with the following type `{ username: string; password: string; }`. This will allow you to create demo user credentials that are public.

Please note, this does not prevent changes and resetting the DB is up to the developer to configure on their own. (a github action that clears the tables and adds the desired values back on a schedule is one idea for this.)