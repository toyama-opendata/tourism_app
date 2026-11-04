/* Copy this file into a spreadsheet-bound Apps Script project.
 * Set SPREADSHEET_ID in Script Properties, run setup(), then deploy as web app.
 * No personal free text, email address, IP address or user agent is stored.
 */
var SCHEMA_VERSION = '0.3.0';
var SHEET_NAME = 'events';
var PREFECTURES = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
var HEADERS = ['received_at','timestamp','event_id','result_id','event_type','session_id','app_version','consent'].concat(Array.from({length:20},function(_,i){return 'q'+(i+1);})).concat(['axis1','axis2','axis3','axis4','type','age','prefecture','companion','experience','recommended_spot_ids','clicked_spot_id']);

function validUuid(v){return typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);}
function validSpot(v){return typeof v==='string' && /^tym\d{3}$/.test(v) && Number(v.slice(3))>=1 && Number(v.slice(3))<=47;}
function assertCondition(ok,message){if(!ok)throw new Error(message);}
function validatePayload(p){
  assertCondition(p && typeof p==='object' && !Array.isArray(p),'payload');
  assertCondition(p.consent===true,'consent');
  ['event_id','result_id','session_id'].forEach(function(k){assertCondition(validUuid(p[k]),k);});
  assertCondition(['diagnosis','spot_click'].indexOf(p.event_type)>=0,'event_type');
  assertCondition(p.event_type!=='diagnosis'||p.event_id===p.result_id,'result_id');
  assertCondition(p.app_version===SCHEMA_VERSION,'app_version');
  assertCondition(typeof p.timestamp==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.timestamp) && Number.isFinite(Date.parse(p.timestamp)),'timestamp');
  assertCondition(p.answers && typeof p.answers==='object' && Object.keys(p.answers).length===20,'answers');
  var expected=[0,0,0,0],answers=[];
  for(var i=0;i<20;i++){
    var value=p.answers['q'+(i+1)];
    assertCondition(Number.isInteger(value)&&value>=1&&value<=5,'answer_range');
    answers.push(value);expected[Math.floor(i/5)]+=((value-3)/2)*(i%5>=3?-1:1)/5;
  }
  assertCondition(Array.isArray(p.axis_scores)&&p.axis_scores.length===4,'axis_scores');
  p.axis_scores.forEach(function(value,i){assertCondition(typeof value==='number'&&Number.isFinite(value)&&Math.abs(value-expected[i])<1e-9,'axis_mismatch');});
  var pairs=['NC','AR','GE','MH'];
  var code=expected.map(function(value,i){return pairs[i][value>=0?0:1];}).join('');
  assertCondition(p.type===code,'type_mismatch');
  var a=p.attributes;
  assertCondition(a&&typeof a==='object'&&['age','prefecture','companion','experience'].every(function(k){return Object.prototype.hasOwnProperty.call(a,k);})&&Object.keys(a).length===4,'attributes');
  assertCondition(a.age===null||[0,10,20,30,40,50,60,70,80].indexOf(a.age)>=0,'age');
  assertCondition(a.prefecture===null||PREFECTURES.indexOf(a.prefecture)>=0,'prefecture');
  assertCondition(a.companion===null||(Number.isInteger(a.companion)&&a.companion>=0&&a.companion<=8),'companion');
  assertCondition(a.experience===null||['なし','1回','2回以上','県内在住'].indexOf(a.experience)>=0,'experience');
  assertCondition(Array.isArray(p.recommended_spot_ids)&&p.recommended_spot_ids.length===6&&p.recommended_spot_ids.every(validSpot)&&new Set(p.recommended_spot_ids).size===6,'recommendations');
  if(p.event_type==='spot_click')assertCondition(validSpot(p.clicked_spot_id)&&p.recommended_spot_ids.indexOf(p.clicked_spot_id)>=0,'clicked_spot_id');
  else assertCondition(p.clicked_spot_id===undefined,'unexpected_click');
  return [new Date().toISOString(),p.timestamp,p.event_id,p.result_id,p.event_type,p.session_id,p.app_version,true].concat(answers,expected,[p.type,a.age,a.prefecture,a.companion,a.experience,p.recommended_spot_ids.join('|'),p.clicked_spot_id||'']).map(function(v){return v===null?'':v;});
}
function spreadsheet(){var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('Set SPREADSHEET_ID');return SpreadsheetApp.openById(id);}
function setup(){
  var ss=spreadsheet(),sheet=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME);
  if(sheet.getLastRow()===0){sheet.appendRow(HEADERS);sheet.setFrozenRows(1);}
  assertCondition(JSON.stringify(sheet.getRange(1,1,1,HEADERS.length).getValues()[0])===JSON.stringify(HEADERS),'header_mismatch');
}
function doPost(e){
  var lock;
  try{
    assertCondition(e&&e.postData&&typeof e.postData.contents==='string'&&e.postData.contents.length<=20000,'body');
    var p=JSON.parse(e.postData.contents),row=validatePayload(p);
    lock=LockService.getScriptLock();lock.waitLock(10000);
    var sheet=spreadsheet().getSheetByName(SHEET_NAME);
    assertCondition(sheet,'Run setup first');
    assertCondition(JSON.stringify(sheet.getRange(1,1,1,HEADERS.length).getValues()[0])===JSON.stringify(HEADERS),'header_mismatch');
    // Serialised duplicate check: a manual retry uses the same event_id.
    if(sheet.getLastRow()>1){
      var found=sheet.getRange(2,3,sheet.getLastRow()-1,1).createTextFinder(p.event_id).matchEntireCell(true).findNext();
      if(found)return response({ok:true,duplicate:true});
    }
    sheet.appendRow(row);SpreadsheetApp.flush();
    return response({ok:true});
  }catch(error){return response({ok:false,error:'invalid_or_unavailable'});}
  finally{if(lock&&lock.hasLock())lock.releaseLock();}
}
function doGet(){return response({service:'toyama-tabitype-collector',version:SCHEMA_VERSION});}
function response(body){return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);}
