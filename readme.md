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
  internal state via `value` and `invalid` properties.
- Powerful Low-Code-Engine to formulate constraints appearance criteria or
  determine output schema for rest-endpoints.
- Conditionally hide and show various html content determined by the current
  form state.
- Integrated Re-Captcha v3 (no user challenge) and v2 (with user challenge)
  fallback mechanism.
- Powerful dynamic input configuration via input attributes, form attributes or
  url query parameter.
- Explicit enable-listing capability to allow what to configure via url.
- Fully configurable data transformation and serialisation engine.
- Dynamic connect input configurations. Derive input configurations from other
  input or form state at runtime.
- Statically type checked and interface specification via Typescript.
