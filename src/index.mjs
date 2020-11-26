// get successful control from form and assemble into object
// http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2

// types which indicate a submit action and are not successful controls
// these will be ignored
const k_r_submitter = /^(?:submit|button|image|reset|file)$/i;

// node names which could be successful controls
const k_r_success_contrls = /^(?:input|select|textarea|keygen)/i;

// Matches bracket notation.
const brackets = /(\[[^\[\]]*\])/g;

// serializes form fields
// @param form MUST be an HTMLForm element
// @param options is an optional argument to configure the serialization. Default output
// with no options specified is a url encoded string
//    - hash: [true | false] Configure the output type. If true, the output will
//    be a js object.
//    - serializer: [function] Optional serializer function to override the default one.
//    The function takes 3 arguments (result, key, value) and should return new result
//    hash and url encoded str serializers are provided with this module
//    - disabled: [true | false]. If true serialize disabled fields.
//    - empty: [true | false]. If true serialize empty fields

export function serialize(form, options) {
    if (typeof options != 'object') {
        options = { hash: !!options };
    }
    else if (options.hash === undefined) {
        options.hash = true;
    }

    let result = (options.hash) ? {} : '';
    const serializer = options.serializer || ((options.hash) ? hash_serializer : str_serialize);

    const elements = form && form.elements ? form.elements : [];

    //Object store each radio and set if it's empty or not
    const radio_store = Object.create(null);

    for (let element of elements) {

        // ingore disabled fields
        if ((!options.disabled && element.disabled) || !element.name) {
            continue;
        }
        // ignore anyhting that is not considered a success field
        if (!k_r_success_contrls.test(element.nodeName) ||
            k_r_submitter.test(element.type)) {
            continue;
        }

        const key = element.name;
        const type = element.type;
        let val = element.value;

        switch (type) {
            case 'number':
                if (val != undefined)
                    val = Number(val);
                break;
            case 'checkbox':
                if (options.booleans) {
                    if (element.indeterminate)
                        val=null;         
                    else                    
                    val = element.checked;
                }
                else {
                    if (!element.checked) {
                        val = '';
                    }
                }
                break;

            case 'radio': {
                if (!radio_store[key] && !element.checked) {
                    radio_store[key] = false;
                }
                else if (element.checked) {
                    radio_store[key] = true;
                }
                if (!element.checked) {
                    val = undefined;
                    continue;
                }
                break;
            }

            case 'select-multiple': {
                if (!(options.empty || options.booleans) && !val) {
                    continue;
                }
                val = [];
                const selectOptions = element.options;
                let isSelectedOptions = false;
                for (let option of selectOptions) {
                    const allowedEmpty = (options.empty || options.booleans) && !option.value;
                    const hasValue = (option.value || allowedEmpty);
                    if (option.selected && hasValue) {
                        isSelectedOptions = true;

                        // If using a hash serializer be sure to add the
                        // correct notation for an array in the multi-select
                        // context. Here the name attribute on the select element
                        // might be missing the trailing bracket pair. Both names
                        // "foo" and "foo[]" should be arrays.
                        if (options.hash && key.slice(key.length - 2) !== '[]') {
                            result = serializer(result, key + '[]', option.value);
                        }
                        else {
                            result = serializer(result, key, option.value);
                        }
                    }
                }

                // Serialize if no selected options and options.empty is true
                if (!isSelectedOptions && (options.empty || options.booleans)) {
                    result = serializer(result, key, '');
                }
                continue;
            }
        }
        if (!(options.empty || options.booleans) && !val) {
            continue;
        }
        result = serializer(result, key, val);
    }

    // Check for all empty radio buttons and serialize them with key=""
    if (options.empty || options.booleans) {
        for (let key in radio_store) {
            if (!radio_store[key]) {
                result = serializer(result, key, '');
            }
        }
    }
    return result;


    // Object/hash encoding serializer.
    function hash_serializer(result, key, value) {
        const matches = key.match(brackets);

        // Has brackets? Use the recursive assignment function to walk the keys,
        // construct any missing objects in the result tree and make the assignment
        // at the end of the chain.
        if (matches) {
            const keys = parse_keys(key);
            hash_assign(result, keys, value);
        }
        else {
            // Non bracket notation can make assignments directly.
            const existing = result[key];

            // If the value has been assigned already (for instance when a radio and
            // a checkbox have the same name attribute) convert the previous value
            // into an array before pushing into it.
            //
            // NOTE: If this requirement were removed all hash creation and
            // assignment could go through `hash_assign`.
            if (existing) {
                if (!Array.isArray(existing)) {
                    result[key] = [existing];
                }

                result[key].push(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;

        function parse_keys(string) {
            const keys = [];
            const prefix = /^([^\[\]]*)/;
            const children = new RegExp(brackets);
            let match = prefix.exec(string);

            if (match[1]) {
                keys.push(match[1]);
            }

            while ((match = children.exec(string)) !== null) {
                keys.push(match[1]);
            }
            return keys;
        }

        function hash_assign(result, keys, value) {
            if (keys.length === 0) {
                result = value;
                return result;
            }

            const key = keys.shift();
            const between = key.match(/^\[(.+?)\]$/);

            if (key === '[]') {
                result = result || [];

                if (Array.isArray(result)) {
                    result.push(hash_assign(null, keys, value));
                }
                else {
                    // This might be the result of bad name attributes like "[][foo]",
                    // in this case the original `result` object will already be
                    // assigned to an object literal. Rather than coerce the object to
                    // an array, or cause an exception the attribute "_values" is
                    // assigned as an array.
                    result._values = result._values || [];
                    result._values.push(hash_assign(null, keys, value));
                }

                return result;
            }

            // Key is an attribute name and can be assigned directly.
            if (!between) {
                result[key] = hash_assign(result[key], keys, value);
            }
            else {
                const string = between[1];
                // +var converts the variable into a number
                // better than parseInt because it doesn't truncate away trailing
                // letters and actually fails if whole thing is not a number
                const index = +string;

                // If the characters between the brackets is not a number it is an
                // attribute name and can be assigned directly.
                if (isNaN(index)) {
                    result = result || {};
                    result[string] = hash_assign(result[string], keys, value);
                }
                else {
                    result = result || [];
                    result[index] = hash_assign(result[index], keys, value);
                }
            }
            return result;
        }
    }

    // urlform encoding serializer
    function str_serialize(result, key, value) {
        if (typeof value === 'string') {
            value = value.replace(/(\r)?\n/g, '\r\n');
            value = encodeURIComponent(value);

            // spaces should be '+' rather than '%20'.
            value = value.replace(/%20/g, '+');
        }

        return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value;
    }
}