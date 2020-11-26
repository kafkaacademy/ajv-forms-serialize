import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import {string} from 'rollup-plugin-string'

const dist='dist';
const bundle= 'bundle'
const production = !process.env.ROLLUP_WATCH

export default {
    input: 'src/index.mjs',
    output: [
        {
            file: `${dist}/${bundle}.cjs.js`,
            format: 'cjs'
        },
        {
            file: `${dist}/${bundle}.esm.js`,
            format: 'esm'
        }, {
            name : 'ajv-forms',
            file: `${dist}/${bundle}.umd.js`,
             format: 'umd'
        }
    ],
    "plugins":[
        resolve(),
        babel({
            exclude : 'node_modules'
        }),
        string({
            include:  '**/*.css'
        })
   //     ,production && terser()
    ]

}