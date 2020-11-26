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
            file: `${dist}/${bundle}.esm.mjs`,
            format: 'esm'
        }
    ],
    "plugins":[
        resolve(),
      
        string({
            include:  '**/*.css'
        })
        ,production && terser()
    ]

}