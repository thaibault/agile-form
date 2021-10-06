// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
'use strict'
/* !
    region header
    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import {globalContext} from 'clientnode'
import nodeFetch from 'node-fetch'

import api, {AgileForm} from './index'
// endregion
globalContext.fetch = nodeFetch as unknown as typeof fetch

const name:string = 'test-form'
api.register(name)

describe('api', ():void => {
    test('api definitions', ():void => {
        expect(api).toBeDefined()
        expect(api).toHaveProperty('component', AgileForm)

        expect(document.createElement(name)).toBeInstanceOf(AgileForm)
    })
})
describe('AgileForm', ():void => {
    test('custom element definition', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toBeDefined()
    })
    test('attribute configuration', ():void => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        form.setAttribute('configuration', '{value: 2}')

        expect(form).toHaveProperty('configuration.value', 2)
        expect(form).toHaveProperty('resolvedConfiguration.value', 2)
    })
    test('input connections', async ():Promise<void> => {
        const form:AgileForm = document.createElement(name) as AgileForm
        document.body.appendChild(form)

        expect(form).toHaveProperty('inputConfigurations', {})

        const input:HTMLElement = document.createElement('generic-input')
        const inputName:string = 'test'
        input.setAttribute('name', inputName)
        form.appendChild(input)
        await form.render()

        expect(form.inputConfigurations).toHaveProperty('test.domNode', input)
        expect(form.inputConfigurations)
            .toHaveProperty('test.domNodes', [input])
        expect(form.inputConfigurations).toHaveProperty('test.dependsOn', null)
        expect(form.inputConfigurations).toHaveProperty('test.name', 'test')
        expect(form.inputConfigurations).toHaveProperty('test.properties', {})
        expect(form.inputConfigurations).toHaveProperty('test.shown', true)

        form.resolvedConfiguration.inputs[inputName] = {}
        await form.render()
        expect(form.inputConfigurations)
            .toHaveProperty([inputName, 'domNode'], input)
    })
})
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
