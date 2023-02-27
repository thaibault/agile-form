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

[![npm](https://img.shields.io/npm/v/agile-form?color=%23d55e5d&label=npm%20package%20version&logoColor=%23d55e5d)](https://www.npmjs.com/package/agile-form)
[![npm downloads](https://img.shields.io/npm/dy/agile-form.svg)](https://www.npmjs.com/package/agile-form)

[![<LABEL>](https://github.com/thaibault/agile-form/actions/workflows/build.yaml/badge.svg)](https://github.com/thaibault/agile-form/actions/workflows/build.yaml)
[![<LABEL>](https://github.com/thaibault/agile-form/actions/workflows/test.yaml/badge.svg)](https://github.com/thaibault/agile-form/actions/workflows/test.yaml)
[![<LABEL>](https://github.com/thaibault/agile-form/actions/workflows/test-coverage-report.yaml/badge.svg)](https://github.com/thaibault/agile-form/actions/workflows/test-coverage-report.yaml)
[![<LABEL>](https://github.com/thaibault/agile-form/actions/workflows/check-types.yaml/badge.svg)](https://github.com/thaibault/agile-form/actions/workflows/check-types.yaml)
[![<LABEL>](https://github.com/thaibault/agile-form/actions/workflows/lint.yaml/badge.svg)](https://github.com/thaibault/agile-form/actions/workflows/lint.yaml)

[![code coverage](https://coveralls.io/repos/github/thaibault/agile-form/badge.svg)](https://coveralls.io/github/thaibault/agile-form)

[![documentation website](https://img.shields.io/website-up-down-green-red/https/torben.website/agile-form.svg?label=documentation-website)](https://torben.website/agile-form)

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

        <%- include('web-component-wrapper/polyfill.html') %>

        <script src="/agile-form/index.bundle.js"></script>
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
