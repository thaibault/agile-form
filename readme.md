<!-- !/usr/bin/env markdown
-*- coding: utf-8 -*-
region header
Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

License
-------

This library written by Torben Sickert stand under a creative commons naming
3.0 unported license. See https://creativecommons.org/licenses/by/3.0/deed.de
endregion -->

Project status
--------------

[![npm](https://img.shields.io/npm/v/agile-form?color=%23d55e5d&label=npm%20package%20version&logoColor=%23d55e5d&style=for-the-badge)](https://www.npmjs.com/package/agile-form)
[![npm downloads](https://img.shields.io/npm/dy/agile-form.svg?style=for-the-badge)](https://www.npmjs.com/package/agile-form)

[![build](https://img.shields.io/github/actions/workflow/status/thaibault/agile-form/build.yaml?style=for-the-badge)](https://github.com/thaibault/agile-form/actions/workflows/build.yaml)

[![check types](https://img.shields.io/github/actions/workflow/status/thaibault/agile-form/check-types.yaml?label=check%20types&style=for-the-badge)](https://github.com/thaibault/agile-form/actions/workflows/check-types.yaml)
[![lint](https://img.shields.io/github/actions/workflow/status/thaibault/agile-form/lint.yaml?label=lint&style=for-the-badge)](https://github.com/thaibault/agile-form/actions/workflows/lint.yaml)
[![test](https://img.shields.io/github/actions/workflow/status/thaibault/agile-form/test-coverage-report.yaml?label=test&style=for-the-badge)](https://github.com/thaibault/agile-form/actions/workflows/test-coverage-report.yaml)

[![code coverage](https://img.shields.io/coverallsCoverage/github/thaibault/agile-form?label=code%20coverage&style=for-the-badge)](https://coveralls.io/github/thaibault/agile-form)

[![documentation website](https://img.shields.io/website-up-down-green-red/https/torben.website/agile-form.svg?label=documentation-website&style=for-the-badge)](https://torben.website/agile-form)

[![Try out](https://img.shields.io/badge/Try%20it%20on%20runkit-%2345cc11?style=for-the-badge)](https://npm.runkit.com/agile-form)

Use case
--------

Agile-Form is a reusable highly configurable low-code form technology. This
Library enables you to decouple a form data specification from its
representation.

Features included:

- Full input agnostic. Use native inputs or web-components providing its
  internal state via `value`, `invalid` or other input properties.
- Powerful Low-Code-Engine to formulate constraints input or various nested
  element appearance criteria or determine output schema for rest-endpoints.
- Conditionally hide and show various html content determined by the current
  form state.
- Integrated Re-Captcha v3 (no user challenge) and v2 (with user challenge)
  fallback mechanism.
- Powerful dynamic input configuration via input attributes, form attributes,
  configuration given by external endpoint or url query parameter.
- Explicit enable-list capability to allow what to allow to configure via url.
- Fully configurable data transformation and serialisation engine.
- Dynamic inter-input configurations. Derive input configurations from other
  dependent input elements or runtime form state.
- Dynamic output evaluation in specified output html elements.
- Automatic button interactions for "submit", "reset", "clear" and "truncate".
- Consolidated form validation state derived by input states.
- Statically type checked and interface specification via Typescript.
- Interactive form build support designed for content management systems.

### Quick-Start

```HTML
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <!--Prevent browser caching-->
        <meta http-equiv="cache-control" content="no-cache">
        <meta http-equiv="expires" content="0">
        <meta http-equiv="pragma" content="no-cache">

        <title>playground</title>

        <script
            src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.7.0/webcomponents-bundle.js"
        ></script>
        <script
            src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.7.0/custom-elements-es5-adapter.js"
        ></script>

        <script
            src="https://torben.website/agile-form/data/distributionBundle/index.bundle.js"
        ></script>

        <script>
            agileForm.index.api.register()
        </script>
    </head>
    <body>
        <agile-form
            configuration="{
                inputs: {
                    name: {}
                }
            }"
        >
            <div class="agile-form__status-message"></div>

            <div
                class="agile-form__group"
                name="send-report"
                show-if="submitted"
            >
                Form-Result: <pre>${Tools.represent(getData())}</pre>
            </div>

            <input name="name" />

            <button type="submit">OK</button>
        </agile-form>
    </body>
<html>
```
