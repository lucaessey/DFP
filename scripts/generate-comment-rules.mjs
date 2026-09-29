// Generate the repeated projection checks from one policy; commit the resulting rules too.
import {writeFileSync} from 'node:fs';
const owner="(auth != null && auth.token.email == 'lucaessey@gmail.com' && auth.token.email_verified == true && (auth.token.firebase.sign_in_provider == 'password' || auth.token.firebase.sign_in_provider == 'google.com'))";
const indexed="($stars == 'all' || $stars.matches(/^[1-5]$/)) && query.orderByKey && query.limitToLast != null && query.limitToLast <= 21";
const parent="newData.parent().parent().parent()";
const canonical=`${parent}.child('internal/records').child(newData.child('id').val())`;
const field=name=>`newData.child('${name}').val()`;
const nonblank=field('text')+[' ',String.fromCharCode(9),String.fromCharCode(10),String.fromCharCode(13),'\u00a0','\u200b','\u200c','\u200d','\ufeff'].map(c=>`.replace(${JSON.stringify(c)}, '')`).join('')+'.length > 0';
// RTDB regexes count UTF-16 units. Count a surrogate pair as one character, like the form.
const range=(a,b)=>`[${String.fromCharCode(a)}-${String.fromCharCode(b)}]`;
const textLength=`${field('text')}.matches(/^(${range(0xd800,0xdbff)}${range(0xdc00,0xdfff)}|[^${String.fromCharCode(0xd800)}-${String.fromCharCode(0xdfff)}]){1,500}$/)`;
const same=(base,names)=>names.map(name=>`${field(name)} == ${base}.child('${name}').val()`).join(' && ');
const only=names=>Object.fromEntries(names.map(name=>[name,{}]).concat([['$other',{'.validate':false}]]));
const publicFields=['id','text','rating','createdAt'];
const ownerFields=[...publicFields,'audience','status','read','revision','reason','reported'];
const views={};
for(const name of ['public','private','pending','ownerPublic']){
  const fields=name==='public'?publicFields:ownerFields;
  const status={public:'published',private:'producer',pending:'pending',ownerPublic:'published'}[name];
  const creator=`auth != null && !data.exists() && newData.exists() && !root.child('peopleComments/internal/records').child(${field('id')}).exists() && ${canonical}.child('uid').val() == auth.uid`;
  views[name]={'$stars':{
    '.read':`${indexed}${name==='public'?'':` && ${owner}`}`,
    '.indexOn':['createdAt'],
    '$key':{
      '.write':`(${owner})${['private','pending'].includes(name)?` || (${creator})`:''}`,
      '.validate':`newData.hasChildren(${JSON.stringify(fields)}) && ${canonical}.exists() && ${canonical}.child('sortKey').val() == $key && ($stars == 'all' || $stars == ${field('rating')} + '') && ${canonical}.child('status').val() == '${status}' && ${same(canonical,fields)}${['public','ownerPublic'].includes(name)?` && ${canonical}.child('audience').val() == 'everyone'`:''}`,
      ...only(fields)
    }
  }};
}
const baseFields=['id','uid','fingerprint','text','rating','audience','status','createdAt','sortKey','revision'];
const receipt=`${parent}.child('receipts').child(auth.uid).child(${field('requestId')})`;
const limits=`${parent}.child('submissionLimits').child(auth.uid)`;
const immutable=['id','uid','fingerprint','text','rating','audience','createdAt','sortKey'];
const create=`!data.exists() && newData.hasChildren(['requestId','requestedAt','acknowledged','read','reason','reported']) && ${field('uid')} == auth.uid && ${field('requestId')}.matches(/^[a-zA-Z0-9_-]{16,80}$/) && ${field('requestedAt')} >= now - 300000 && ${field('requestedAt')} <= now + 300000 && ${field('sortKey')} == ${field('requestedAt')} + '_' + $id && ${field('createdAt')} == now && ${field('revision')} == 1 && ${field('read')} == false && ${field('reported')} == false && ${field('acknowledged')} == (${field('audience')} == 'producer') && ${field('status')} == (${field('audience')} == 'producer' ? 'producer' : 'pending') && ${limits}.child('lastId').val() == $id && ${limits}.child('lastAt').val() == now && ${receipt}.child('id').val() == $id && ${receipt}.child('fingerprint').val() == ${field('fingerprint')} && ${parent}.child(${field('audience')} == 'producer' ? 'private' : 'pending').child('all').child(${field('sortKey')}).child('id').val() == $id && ${parent}.child(${field('audience')} == 'producer' ? 'private' : 'pending').child(${field('rating')} + '').child(${field('sortKey')}).child('id').val() == $id`;
const transitions="((data.child('status').val() == 'pending' && (newData.child('status').val() == 'rejected' || newData.child('status').val() == (data.child('audience').val() == 'producer' ? 'producer' : 'published'))) || (data.child('status').val() == 'producer' && newData.child('status').val() == 'producer' && newData.child('read').val() == true) || (data.child('status').val() == 'published' && newData.child('status').val() == 'hidden'))";
const update=`data.exists() && ${owner} && ${same('data',immutable)} && ${field('revision')} == data.child('revision').val() + 1 && ${field('updatedAt')} == now && ${field('actionId')}.matches(/^[a-zA-Z0-9_-]{16,80}$/) && ${transitions}`;
const quota=(period,duration,max)=>`newData.child('${period}Count').isNumber() && newData.child('${period}Count').val() <= ${max} && ((!data.child('${period}Start').exists() || data.child('${period}Start').val() <= now - ${duration}) ? (newData.child('${period}Start').val() == now && newData.child('${period}Count').val() == 1) : (newData.child('${period}Start').val() == data.child('${period}Start').val() && newData.child('${period}Count').val() == data.child('${period}Count').val() + 1))`;
const rules={rules:{'.read':false,'.write':false,peopleComments:{
  ...views,
  internal:{records:{'$id':{
    '.read':owner,
    '.write':`auth != null && newData.exists() && (!data.exists() || ${owner})`,
    '.validate':`newData.hasChildren(${JSON.stringify(baseFields)}) && $id.matches(/^[a-f0-9]{48}$/) && ${field('id')} == $id && newData.child('text').isString() && ${textLength} && ${nonblank} && newData.child('rating').isNumber() && ${field('rating')} >= 1 && ${field('rating')} <= 5 && ${field('rating')} % 1 == 0 && (${field('audience')} == 'everyone' || ${field('audience')} == 'producer') && (${field('audience')} != 'producer' || ${field('status')} != 'published') && ((${create}) || (${update}))`,
    ...only([...baseFields,'requestId','requestedAt','acknowledged','read','reason','reported','actionId','lastAction','updatedAt','actions','reports','moderationVersion']),
    fingerprint:{'.validate':"newData.isString() && newData.val().matches(/^[a-f0-9]{64}$/)"},
    reason:{'.validate':'newData.isString() && newData.val().length <= 300'},
    read:{'.validate':'newData.isBoolean()'},reported:{'.validate':'newData.isBoolean()'},
    actions:{'.validate':`data.parent().exists() && ${owner}`},
    reports:{'.validate':`data.parent().exists() && ${owner}`},
    moderationVersion:{'.validate':`data.parent().exists() && ${owner}`}
  }}},
  receipts:{'$uid':{'$request':{
    '.read':'auth != null && auth.uid == $uid',
    '.write':'auth != null && auth.uid == $uid && !data.exists() && newData.exists()',
    '.validate':`$request.matches(/^[a-zA-Z0-9_-]{16,80}$/) && newData.hasChildren(['id','fingerprint','status','createdAt']) && ${canonical}.child('uid').val() == $uid && ${canonical}.child('requestId').val() == $request && ${same(canonical,['id','fingerprint','status','createdAt'])}`,
    ...only(['id','fingerprint','status','createdAt'])
  }}},
  submissionLimits:{'$uid':{
    '.read':'auth != null && auth.uid == $uid',
    '.write':'auth != null && auth.uid == $uid && newData.exists()',
    '.validate':`newData.hasChildren(['lastId','lastAt','hourStart','hourCount','dayStart','dayCount']) && newData.child('lastId').isString() && ${field('lastAt')} == now && (!data.exists() || data.child('lastAt').val() <= now - 30000) && ${quota('hour',3600000,6)} && ${quota('day',86400000,20)}`,
    ...only(['lastId','lastAt','hourStart','hourCount','dayStart','dayCount'])
  }},
  reports:{'$id':{
    '.read':`${owner} && query.orderByKey && query.limitToLast != null && query.limitToLast <= 1`,
    '$uid':{
      '.read':'auth != null && auth.uid == $uid',
      '.write':"auth != null && auth.uid == $uid && !data.exists() && newData.exists() && root.child('peopleComments/internal/records').child($id).child('status').val() == 'published'",
      '.validate':"newData.hasChildren(['createdAt']) && newData.child('createdAt').val() == now",
      ...only(['createdAt'])
    }
  }}
}}};
writeFileSync('firebase/database.rules.json',JSON.stringify(rules,null,2)+'\n');
