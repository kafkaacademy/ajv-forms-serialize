# ajv-forms-serialize

Improvements compared to [form-serialize](https://www.npmjs.com/package/form-serialize) (forked from there) 

This package takes a HTML form as input and makes a json/ json based output 
of the form's content.

The regular input fields of the form are detected (see MDN) and a nice json object is created.


## Arrays of objects

Arrays of fields  are handled if you name the input as in this example.

```html
<form>
	<input type="checkbox" name="foo[]" value="bar" checked/>
	<input type="checkbox" name="foo[]" value="baz" checked/>
	<input type="checkbox" name="foo[]" value="baz"/>
</form>
```

will produce json:

 ```json
  {
	  'foo': ['bar', 'baz', '']
  }
 ```

## Nested objects :

Nested structures can be handled by giving the fields the right names:
```html
<form>
	<input type="email" name="account[name]" value="Foo Dude">
	<input type="text" name="account[email]" value="foobar@example.org">
	<input type="text" name="account[address][city]" value="Qux">
	<input type="text" name="account[address][state]" value="CA">
	<input type="text" name="account[address][empty]" value="">
</form>
```   
will produce json :

```json
account: {
		name: 'Foo Dude',
		email: 'foobar@example.org',
		address: {
			city: 'Qux',
			state: 'CA'
		}
	}
```

## MDN standards

This serializer serializes default according to the Mozilla (MDN) standards, to JSON.

However, the JSON Schema definition https://json-schema.org/understanding-json-schema/ 
where Big Data makes use of, has some other requirements.

In order to generate neat JSON for Big Data (like Apache Kafka), there is a big wish to
let HTML5 forms export data that is more according to the JSON schema definitions.

That's why we adapt the serialization towards these requirements.

So , without specifying options, we adhere to the standards of MDN.

With several options we can adapt the serialization to Big Data needs.




The improvements:

1. number input fields now give a number and not a string

2. checkbox input fields are checked against [Mozilla standards](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)

3.	serialize with option booleans: true: 

```js

serialize(form, { hash : true, booleans: true }

```
this will serialize checkbox input to booleans.
	
4. 100% coverage in the tests

## install

```shell

npm install ajv-forms-serialize

```

## use

form-serialize supports two output formats, url encoded (default) or hash (js objects).

Lets serialize the following html form:
```html
<form id="example-form">
	<input type="text" name="foo" value="bar"/>
	<input type="submit" value="do it!"/>
</form>
```

```js
const serialize = require('ajv-forms-serialize');
var form = document.querySelector('#example-form');

var str = serialize(form);
// str -> "foo=bar"

var obj = serialize(form, { hash: true });
// obj -> { foo: 'bar' }
```

## api

### serialize(form [, options])

Returns a serialized form of a HTMLForm element. Output is determined by the serializer used. Default serializer is url-encoded.

arg | type | desc
:--- | :--- | :---
form | HTMLForm | must be an HTMLForm element
options | Object | optional options object

#### options

option | type | default | desc
:--- | :--- | :---: | :---
hash | boolean | false | if `true`, the hash serializer will be used for `serializer` option
serializer | function | url-encoding | override the default serializer (hash or url-encoding)
disabled | boolean | false | if `true`, disabled fields will also be serialized
empty | boolean | false | if `true`, empty fields will also be serialized
booleans | boolean | false | if `true`, html checkbox fields will serialize as boolean

More on option "booleans": 
```js
const str = serialize(form, { hash : true, booleans: true });
```

if an input of type checkbox has state indeterminate = true (see MDN) , null is produced in the json;
( indeterminate can only be set by javascript in the HTMLInputElement)


### custom serializer

Serializers take 3 arguments: `result`, `key`, `value` and should return a newly updated result.

See the example serializers in the serialize.test.js source file.

## notes

only [successful control](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2) form fields are serialized (with the exception of disabled fields if disabled option is set)

multiselect fields with more than one value will result in an array of values in the `hash` output mode using the default hash serializer

### explicit array fields

Fields who's name ends with `[]` are **always** serialized as an array field in `hash` output mode using the default hash serializer.
The field name also gets the brackets removed from its name.

This does not affect `url-encoding` mode output in any way.

```html
<form id="example-form">
	<input type="checkbox" name="foo[]" value="bar" checked />
	<input type="checkbox" name="foo[]" value="baz" />
	<input type="submit" value="do it!"/>
</form>
```

```js
import serialize from 'ajv-forms-serialize';
var form = document.querySelector('#example-form');

var obj = serialize(form, { hash: true });
// obj -> { foo: ['bar'] }

var str = serialize(form);
// str -> "foo[]=bar"

```
or you can import using:

```
const serialize=require('ajv-forms-serialize');
```

### indexed arrays

Adding numbers between brackets for the array notation above will result in a hash serialization with explicit ordering based on the index number regardless of element ordering.

Like the "[explicit array fields](explicit-array-fields)" this does not affect url-encoding mode output in any way.

```html
<form id="todos-form">
	<input type="text" name="todos[1]" value="milk" />
	<input type="text" name="todos[0]" value="eggs" />
	<input type="text" name="todos[2]" value="flour" />
</form>
```

```js
var serialize = require('ajv-forms-serialize');
var form = document.querySelector('#todos-form');

var obj = serialize(form, { hash: true });
// obj -> { todos: ['eggs', 'milk', 'flour'] }

var str = serialize(form);
// str -> "todos[1]=milk&todos[0]=eggs&todos[2]=flour"

```

### nested objects

Similar to the indexed array notation, attribute names can be added by inserting a string value between brackets. The notation can be used to create deep objects and mixed with the array notation.

Like the "[explicit array fields](explicit-array-fields)" this does not affect url-encoding mode output.

```html
<form id="nested-example">
	<input type="text" name="foo[bar][baz]" value="qux" />
	<input type="text" name="foo[norf][]" value="item 1" />
</form>
```

```js
var serialize = require('ajv-forms-serialize');
var form = document.querySelector('#todos-form');

var obj = serialize(form, { hash: true });
// obj -> { foo: { bar: { baz: 'qux' } }, norf: [ 'item 1' ] }

```

## references

This module is based on ideas from jQuery serialize and the Form.serialize method from the prototype library

## license

MIT
