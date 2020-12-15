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
import api, {AgileForm} from './index'
// endregion
describe('api', ():void => {
    test('api definitions', ():void => {
        expect(api).toBeDefined()
        expect(api).toHaveProperty('component', AgileForm)

        // TODO
        return
        api.register()
        expect(document.createElement('agile-form')).toBeInstanceOf(AgileForm)
    })
})
describe('AgileForm', ():void => {
    customElements.define('a-form', AgileForm)

    test('custom element definition', ():void => {
        const form:AgileForm = document.createElement('a-form') as AgileForm
        document.body.appendChild(form)
    })
    test('attribute configuration', ():void => {
        const form:AgileForm = document.createElement('a-form') as AgileForm
        document.body.appendChild(form)

        form.setAttribute('configuration', '{value: 2}')

        expect(form).toHaveProperty('configuration.value', 2)
        expect(form).toHaveProperty('resolvedConfiguration.value', 2)
    })
    test('input connections', async ():Promise<void> => {
        const form:AgileForm = document.createElement('a-form') as AgileForm
        document.body.appendChild(form)

        expect(form).toHaveProperty('inputs', {})

        const input:HTMLElement = document.createElement('generic-input')
        const name:string = 'test'
        input.setAttribute('name', name)
        form.appendChild(input)
        await form.render()

        return
        expect(form).toHaveProperty('inputs', {})

        form.resolvedConfiguration.model[name] = {}
        await form.render()
        expect(form.inputs).toHaveProperty(name, input)
    })
})
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
