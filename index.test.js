
import {serialize} from '.';

let formData="";

function domify(html2) {
    if ('string' != typeof html2) {
        console.error('String expected');
        return null;
    }
    document.body.innerHTML = "";
    document.body.innerHTML = html2;
    const form = document.body.children[0];
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        formData = new FormData(form);      
    });
    
   form.submit();
   return form;
}

const hash_check = (form, exp) =>{
  expect(serialize(form, { hash: true })).toEqual(exp);
};

const str_check = (form, exp) =>{
 expect(serialize(form)).toEqual(exp);
};

const disabled_check = function(form, exp) {
 expect(serialize(form, { hash : false, disabled: true })).toEqual(exp);
};


const empty_check_hash = (form, exp) =>{
 expect(serialize(form, { hash : true, disabled: true, empty: true })).toEqual(exp);
};

const boolean_check_hash = (form, exp) =>{
  expect(serialize(form, { hash : true, disabled: true, booleans: true })).toEqual(exp);
 };
 

const empty_check =(form, exp) =>{
  expect(serialize(form, { hash : false, disabled: true, empty: true })).toEqual( exp);
};

test('null form', ()=> {
  hash_check(null, {});
  str_check(null, '');
  empty_check(null, '');
  empty_check_hash(null, {}); 
  boolean_check_hash(null, {}); 
});

test('bad form', ()=> {
  var form = {};
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, '');
  empty_check_hash(form, {});
  boolean_check_hash(form, {});
});

test('empty form', ()=> {
  var form = domify('<form></form>');
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, '');
  empty_check_hash(form, {});
  boolean_check_hash(form, {});
});

// basic form with single input
test('single element', ()=> {
  var form = domify('<form><input type="text" name="foo" value="bar"/></form>');
  hash_check(form, {
      'foo': 'bar'
  });
  str_check(form, 'foo=bar');
  empty_check(form, 'foo=bar');
  empty_check_hash(form, {
      'foo': 'bar'
  });
  boolean_check_hash(form, {
    'foo': 'bar'
});
});

test('single element number', ()=> {
  var form = domify('<form><input type="number" name="anummber" value="123"/></form>');
  hash_check(form, {
      'anummber': 123
  });
  str_check(form, 'anummber=123');
  empty_check(form, 'anummber=123');
  empty_check_hash(form, {
      'anummber': 123
  });
  boolean_check_hash(form, {
    'anummber': 123
});
});

test('ignore no value', ()=> {
  var form = domify('<form><input type="text" name="foo"/></form>');
  hash_check(form, {});
  str_check(form, '');
});

test('do not ignore no value when empty option', ()=> {
  var form = domify('<form><input type="text" name="foo"/></form>');
  empty_check(form, 'foo=');
  empty_check_hash(form, {
      'foo': ''
  });
  boolean_check_hash(form, {
    'foo': ''
});
});

test('multi inputs', ()=> {
  var form = domify(`<form>
      <input type="text" name="foo" value="bar 1"/>
      <input type="text" name="foo.bar" value="bar 2"/>
      <input type="text" name="baz.foo" value="bar 3"/>
      </form>`);
  hash_check(form, {
      'foo': 'bar 1',
      'foo.bar': 'bar 2',
      'baz.foo': 'bar 3'
  });
  str_check(form, 'foo=bar+1&foo.bar=bar+2&baz.foo=bar+3');
});

test('handle disabled', ()=> {
  var form = domify(`<form>
      <input type="text" name="foo" value="bar 1"/>
      <input type="text" name="foo.bar" value="bar 2" disabled/>
      </form>`);
  hash_check(form, {
      'foo': 'bar 1'
  });
  str_check(form, 'foo=bar+1');
  disabled_check(form, 'foo=bar+1&foo.bar=bar+2');
});

test('handle disabled and empty', ()=> {
  var form = domify(`<form>
      <input type="text" name="foo" value=""/>
      <input type="text" name="foo.bar" value="" disabled/>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
  disabled_check(form, '');
  empty_check(form, 'foo=&foo.bar=');
  empty_check_hash(form, {
      'foo': '',
      'foo.bar': ''
  });
  boolean_check_hash(form, {
    'foo': '',
    'foo.bar': ''
});
});

test('ignore buttons', ()=> {
  var form = domify(`<form>
      <input type="submit" name="foo" value="submit"/>
      <input type="reset" name="foo.bar" value="reset"/>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
});

test('checkboxes', ()=> {
  var form = domify(`<form>
      <input type="checkbox" name="foo" checked/>
      <input type="checkbox" name="bar"/>
      <input type="checkbox" name="baz" checked/>
      </form>`);
  hash_check(form, {
      'foo': "on",
      'baz': "on"
  });
  str_check(form, 'foo=on&baz=on');
  empty_check(form, 'foo=on&bar=&baz=on');
  empty_check_hash(form, {
      'foo': "on",
      'bar': "",
      'baz': "on"
  });
  boolean_check_hash(form, {
    'foo': true,
    'bar': false,
    'baz': true
});
});

test('checkboxes - array', ()=> {
  var form = domify(`<form>' +
      <input type="checkbox" name="foo[]" value="bar" checked/>
      <input type="checkbox" name="foo[]" value="baz" checked/>
      <input type="checkbox" name="foo[]" value="baz"/>
      </form>`);
  hash_check(form, {
      'foo': ['bar', 'baz']
  });
  str_check(form, 'foo%5B%5D=bar&foo%5B%5D=baz');
  empty_check(form, 'foo%5B%5D=bar&foo%5B%5D=baz&foo%5B%5D=');
  empty_check_hash(form, {
      'foo': ['bar', 'baz', '']
  });

  boolean_check_hash(form, {
    'foo': [true, true, false]
});
});


test('checkboxes - array with single item', ()=> {
  var form = domify(`<form>
      <input type="checkbox" name="foo[]" value="bar" checked/>
      </form>`);
  hash_check(form, {
      'foo': ['bar']
  });
  str_check(form, 'foo%5B%5D=bar');
});



test('select - single', ()=> {
  var form = domify(`<form>
      <select name="foo">
      <option value="bar">bar</option>
      <option value="baz" selected>baz</option>
      </select>
      </form>`);
  hash_check(form, {
      'foo': 'baz'
  });
  str_check(form, 'foo=baz');
});

test('select - single - empty', function () {
  var form = domify(`<form>
      <select name="foo">
      <option value="">empty</option>
      <option value="bar">bar</option>
      <option value="baz">baz</option>
      </select>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, 'foo=');
  empty_check_hash(form, {
      'foo': ''
  });
  boolean_check_hash(form, {
    'foo': ''
});
});

test('select - multiple', ()=> {
  var form = domify(`<form>
      <select name="foo" multiple>
      <option value="bar" selected>bar</option>
      <option value="baz">baz</option>
      <option value="cat" selected>cat</option>
      </select>
      </form>`);
  hash_check(form, {
      'foo': ['bar', 'cat']
  });
  str_check(form, 'foo=bar&foo=cat');
});


test('select - multiple - empty', ()=> {
  var form = domify(`<form>
      <select name="foo" multiple>
      <option value="">empty</option>
      <option value="bar">bar</option>
      <option value="baz">baz</option>
      <option value="cat">cat</option>
      </select>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, 'foo=');
  empty_check_hash(form, {
      'foo': ''
  });
  boolean_check_hash(form, {
    'foo': ''
});
});

test('radio - no default', ()=> {
  var form = domify(`<form>
      <input type="radio" name="foo" value="bar1"/>
      <input type="radio" name="foo" value="bar2"/>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, 'foo=');
  empty_check_hash(form, {
      'foo':''
  });
  boolean_check_hash(form, {
    'foo':''
});
});

test('radio - single default', ()=> {
  var form = domify(`<form>
      <input type="radio" name="foo" value="bar1" checked="checked"/>
      <input type="radio" name="foo" value="bar2"/>
      </form>`);
  hash_check(form, {
      foo: 'bar1'
  });
  str_check(form, 'foo=bar1');
  empty_check(form, 'foo=bar1');
  empty_check_hash(form, {
      foo: 'bar1'
  });

  boolean_check_hash(form, {
    foo: 'bar1'
});
});

test('radio - empty value', ()=> {
  var form = domify(`<form>
      <input type="radio" name="foo" value="" checked="checked"/>
      <input type="radio" name="foo" value="bar2"/>
      </form>`);
  hash_check(form, {});
  str_check(form, '');
  empty_check(form, 'foo=');
  empty_check_hash(form, {
      'foo':''
  });
  boolean_check_hash(form, {
    'foo':''
});
});

// in this case the radio buttons and checkboxes share a name key
// the checkbox value should still be honored
test('radio w/checkbox', ()=> {
  var form = domify(`<form>
      <input type="radio" name="foo" value="bar1" checked="checked"/>
      <input type="radio" name="foo" value="bar2"/>
      <input type="checkbox" name="foo" value="bar3" checked="checked"/>
      <input type="checkbox" name="foo" value="bar4"/>
      </form>`);
  hash_check(form, {
      foo: ['bar1', 'bar3']
  });
  str_check(form, 'foo=bar1&foo=bar3');

  // leading checkbox
  form = domify(`<form>
      <input type="checkbox" name="foo" value="bar3" checked="checked"/>
      <input type="radio" name="foo" value="bar1" checked="checked"/>
      <input type="radio" name="foo" value="bar2"/>
      <input type="checkbox" name="foo" value="bar4"/>
      <input type="checkbox" name="foo" value="bar5" checked="checked"/>
      </form>`);
  hash_check(form, {
      foo: ['bar3', 'bar1', 'bar5']
  });
  str_check(form, 'foo=bar3&foo=bar1&foo=bar5');
});


test('bracket notation - hashes', ()=> {
  var form = domify(`<form>
      <input type="email" name="account[name]" value="Foo Dude">
      <input type="text" name="account[email]" value="foobar@example.org">
      <input type="text" name="account[address][city]" value="Qux">
      <input type="text" name="account[address][state]" value="CA">
      <input type="text" name="account[address][empty]" value="">
      </form>`);

  hash_check(form, {
      account: {
          name: 'Foo Dude',
          email: 'foobar@example.org',
          address: {
              city: 'Qux',
              state: 'CA'
          }
      }
  });

  empty_check_hash(form, {
      account: {
          name: 'Foo Dude',
          email: 'foobar@example.org',
          address: {
              city: 'Qux',
              state: 'CA',
              empty: ''
          }
      }
  });
  boolean_check_hash(form, {
    account: {
        name: 'Foo Dude',
        email: 'foobar@example.org',
        address: {
            city: 'Qux',
            state: 'CA',
            empty: ''
        }
    }
});
});


test('bracket notation - hashes with a digit as the first symbol in a key', ()=> {
  var form = domify(`<form>
      <input type="text" name="somekey[123abc][first]" value="first_value">
      <input type="text" name="somekey[123abc][second]" value="second_value">
      </form>`);

  hash_check(form, {
      'somekey': {
          '123abc': {
              'first': 'first_value',
              'second': 'second_value'
          }
      }
  });

  empty_check_hash(form, {
      'somekey': {
          '123abc': {
              'first': 'first_value',
              'second': 'second_value'
          }
      }
  });

  boolean_check_hash(form, {
    'somekey': {
        '123abc': {
            'first': 'first_value',
            'second': 'second_value'
        }
    }
});
});


test('bracket notation - select multiple', ()=> {
  var form = domify(`<form>
      <select name="foo" multiple>
        <option value="bar" selected>Bar</option>
        <option value="baz">Baz</option>
        <option value="qux" selected>Qux</option>
      </select>
      </form>`);

  hash_check(form, {
      foo: [ 'bar', 'qux' ]
  });

  // Trailing notation on select.name.
  form = domify(`<form>
      <select name="foo[]" multiple>
        <option value="bar" selected>Bar</option>
        <option value="baz">Baz</option>
        <option value="qux" selected>Qux</option>
      </select>
      </form>`);

  hash_check(form, {
      foo: [ 'bar', 'qux' ]
  });
});

test('bracket notation - select multiple, nested', ()=> {
  var form = domify(`<form>
      <select name="foo[bar]" multiple>
        <option value="baz" selected>Baz</option>
        <option value="qux">Qux</option>
        <option value="norf" selected>Norf</option>
      </select>
      </form>`);

  hash_check(form, {
      foo: {
          bar: [ 'baz', 'norf' ]
      }
  });
});

test('bracket notation - select multiple, empty values', ()=> {
  var form = domify(`<form>
      <select name="foo[bar]" multiple>
        <option selected>Default value</option>
        <option value="" selected>Empty value</option>
        <option value="baz" selected>Baz</option>
        <option value="qux">Qux</option>
        <option value="norf" selected>Norf</option>
      </select>
      </form>`);

  hash_check(form, {
      foo: {
          bar: [ 'Default value', 'baz', 'norf' ]
      }
  });

  empty_check_hash(form, {
      foo: {
          bar: [ 'Default value', '', 'baz', 'norf' ]
      }
  });

  boolean_check_hash(form, {
    foo: {
        bar: [ 'Default value', '', 'baz', 'norf' ]
    }
});
});

test('bracket notation - non-indexed arrays', ()=> {
  var form = domify(`<form>
      <input name="people[][name]" value="fred" />
      <input name="people[][name]" value="bob" />
      <input name="people[][name]" value="bubba" />
      </form>`);

  hash_check(form, {
      people: [
          { name: "fred" },
          { name: "bob" },
          { name: "bubba" },
      ]
  });
});


test('bracket notation - nested, non-indexed arrays', ()=> {
  var form = domify(`<form>
      <input name="user[tags][]" value="cow" />
      <input name="user[tags][]" value="milk" />
      </form>`);

  hash_check(form, {
      user: {
          tags: [ "cow", "milk" ],
      }
  });
});

test('bracket notation - indexed arrays', ()=> {
  var form = domify(`<form>
      <input name="people[2][name]" value="bubba" />
      <input name="people[2][age]" value="15" />
      <input name="people[0][name]" value="fred" />
      <input name="people[0][age]" value="12" />
      <input name="people[1][name]" value="bob" />
      <input name="people[1][age]" value="14" />
      <input name="people[][name]" value="frank">
      <input name="people[3][age]" value="2">
      </form>`);

  hash_check(form, {
      people: [
          {
              name: "fred",
              age: "12"
          },
          {
              name: "bob",
              age: "14"
          },
          {
              name: "bubba",
              age: "15"
          },
          {
              name: "frank",
              age: "2"
          }
      ]
  });
});

test('bracket notation - bad notation', ()=> {
  var form = domify(`<form>
      <input name="[][foo]" value="bar" />
      <input name="[baz][qux]" value="norf" />
      </form>`);

  hash_check(form, {
      _values: [
          { foo: 'bar' }
      ],
      baz: { qux: 'norf' }
  });
});

test('custom serializer', ()=> {
  var form = domify('<form><input type="text" name="node" value="zuul">/</form>');

 expect(serialize(form, {
    serializer: function(curry, k, v) {
      curry[k] = 'ZUUL';
      return curry;
    }
  })).toEqual( {
    "node": "ZUUL"
  });
});

test('extra, see w3 schools', ()=> {
  var form = domify(`<form>
  <input type="text" id="fname" name="fname" value="John"><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
</form> `);

str_check(form, 'fname=John&lname=Doe');
  
});


test('extra see mdn', ()=> {
  var form = domify(`<form>
  <p>
    <fieldset>
      <legend>Do you have a driver's license?<abbr title="This field is mandatory" aria-label="required">*</abbr></legend>
      <!-- While only one radio button in a same-named group can be selected at a time,
           and therefore only one radio button in a same-named group having the "required"
           attribute suffices in making a selection a requirement --> 
      <input type="radio" required name="driver" id="r1" value="yes" checked><label for="r1">Yes</label>
      <input type="radio" required name="driver" id="r2" value="no"><label for="r2">No</label>
    </fieldset>
  </p>
  <p>
    <label for="n1">How old are you?</label>
    <!-- The pattern attribute can act as a fallback for browsers which
         don't implement the number input type but support the pattern attribute.
         Please note that browsers that support the pattern attribute will make it
         fail silently when used with a number field.
         Its usage here acts only as a fallback -->
    <input type="number" min="12" max="120" step="1" id="n1" name="age" value=99
           pattern="\d+">
  </p>
  <p>
    <label for="t1">What's your favorite fruit?<abbr title="This field is mandatory" aria-label="required">*</abbr></label>
    <input type="text" id="t1" name="fruit" list="l1" required value="Banana"
           pattern="[Bb]anana|[Cc]herry|[Aa]pple|[Ss]trawberry|[Ll]emon|[Oo]range">
    <datalist id="l1">
      <option>Banana</option>
      <option>Cherry</option>
      <option>Apple</option>
      <option>Strawberry</option>
      <option>Lemon</option>
      <option>Orange</option>
    </datalist>
  </p>
  <p>
    <label for="t2">What's your e-mail address?</label>
    <input type="email" id="t2" name="email" value="a@b.com">
  </p>
  <p>
    <label for="t3">Leave a short message</label>
    <textarea id="t3" name="msg" maxlength="140" rows="5" >my message</textarea>
  </p>
  <p>
    <button>Submit</button>
  </p>
</form>`);

str_check(form, 'driver=yes&age=99&fruit=Banana&email=a%40b.com&msg=my+message');
  
});



test('extra2', ()=> {
  var form = domify(`
  <form>
  <div>
    <input type="checkbox" id="scales" name="scales" checked>
    <label for="scales">Scales</label>
  </div>
  
  <div>
    <input type="checkbox" id="horns" name="horns">
    <label for="horns">Horns</label>
  </div>
  </form>`);

str_check(form, 'scales=on');
  
});

test('extra3', ()=> {
  var form = domify(`
  <form>
  <div>
    <input type="checkbox" id="subscribeNews" name="subscribe" value="newsletter" checked>
    <label for="subscribeNews">Subscribe to newsletter?</label>
  </div>
  <div>
    <button type="submit">Subscribe</button>
  </div>
</form>`);

str_check(form, 'subscribe=newsletter');
  
});



test('extra4', ()=> {
  var form = domify(`
  <form>
  <fieldset>
      <legend>Choose your interests</legend>
      <div>
        <input type="checkbox" id="coding" name="interest" value="coding" checked>
        <label for="coding">Coding</label>
      </div>
      <div>
        <input type="checkbox" id="music" name="interest" value="music" checked>
        <label for="music">Music</label>
      </div>
    </fieldset>
    <div>
      <button type="submit">Subscribe</button>
    </div>
</form>`);

str_check(form, 'interest=coding&interest=music');
  
});
