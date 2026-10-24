let explosionIcon='💗',isGifting=!![],giftInterval=null,isMessaging=!![],messageInterval=null,messages=[];
async function loadMessages() {
const _0x3773dc= {
'WvlrF':"style/mess.txt",'CfrBx':"Error loading mess.txt:",'SjLCY':'Anh yêu em ❤️'
}
;
try {
const _0x3dc8b4=await fetch(_0x3773dc["WvlrF"]),_0x5c8d33=await _0x3dc8b4["text"]();
messages=_0x5c8d33['split'](/\n/)["map"](_0x247b43=>_0x247b43["trim"]())["filter"](_0xf4846a=>_0xf4846a!=='');
if (messages.length === 0) {
messages = [_0x3773dc["SjLCY"]];
}
}
catch(_0x3a3259) {
console['error'](_0x3773dc["CfrBx"],_0x3a3259),messages=[_0x3773dc["SjLCY"]];
}
}
loadMessages();
const mainContent=document["getElementById"]("mainContent");
function startExperience() {
const _0x1b0001= {
'FdBAn':function(_0x4faaa8,_0x17d439,_0x40bf7b) {
return _0x4faaa8(_0x17d439,_0x40bf7b);
}
,'GKrJA':function(_0x3638f0) {
return _0x3638f0();
}
,'RGsCB':'hidden','WwxFe':function(_0xfeda81,_0x256d87) {
return _0xfeda81!==_0x256d87;
}
,'IietY':"QLoOr",'CmymA':"dTFNY",'wRMUp':"container"
}
;
if(mainContent["classList"]["contains"](_0x1b0001["RGsCB"])) {
if(_0x1b0001["WwxFe"](_0x1b0001["IietY"],_0x1b0001["CmymA"]))mainContent["classList"]["remove"](_0x1b0001["RGsCB"]);
else {
if(_0x6a8fb0) {
const _0x4c19a1=_0x1f6aca["cloneNode"](!![]);
_0x4c19a1['play']();
}
}
}
document["body"]["classList"]["remove"](_0x1b0001["wRMUp"]),_0x1b0001['FdBAn'](setTimeout,()=> {
createFallingImage(),giftInterval=_0x1b0001['FdBAn'](setInterval,createFallingImage,0x3e8),_0x1b0001['GKrJA'](createFallingMessage),messageInterval=setInterval(createFallingMessage,0x5dc);
}
,0x1388);
}
window['addEventListener']("load",startExperience);
function createFallingImage() {
const _0x13e014= {
'nhGWg':"div",'YVhMY':function(_0x4a23fd,_0x1a6e51) {
return _0x4a23fd*_0x1a6e51;
}
,'QKnQL':"heart",'OYfZr':function(_0x5e8f9a,_0x291341) {
return _0x5e8f9a*_0x291341;
}
,'YcUeu':function(_0x3f7e97,_0x3c4ba0) {
return _0x3f7e97+_0x3c4ba0;
}
,'elZHP':function(_0x206d94,_0x155068) {
return _0x206d94*_0x155068;
}
,'edRrZ':function(_0x1f45d9,_0x3ae904) {
return _0x1f45d9*_0x3ae904;
}
,'uZVcB':"--x",'WlULo':function(_0x1df0cf,_0x262565) {
return _0x1df0cf+_0x262565;
}
,'AgQDm':function(_0x40c542,_0x5ec418) {
return _0x40c542+_0x5ec418;
}
,'jYkcE':function(_0x104d5d,_0x4e9723) {
return _0x104d5d-_0x4e9723;
}
,'rzwBA':function(_0x479a65,_0x4605a4) {
return _0x479a65*_0x4605a4;
}
,'SAobG':"deg",'dIODG':function(_0x5434bf,_0x5a1898,_0x88b265) {
return _0x5434bf(_0x5a1898,_0x88b265);
}
,'FijHK':function(_0x58728f,_0x2f1c99) {
return _0x58728f===_0x2f1c99;
}
,'EMEne':'ClsUY','QHWrf':"img",'xjnxF':function(_0x4136e4,_0x34b8a1) {
return _0x4136e4+_0x34b8a1;
}
,'rWrpC':function(_0xa995bc,_0x2ba005) {
return _0xa995bc<_0x2ba005;
}
,'ixYzk':function(_0x1d6ebc,_0x36096d) {
return _0x1d6ebc*_0x36096d;
}
,'nTNlJ':function(_0x447cdc,_0x4bae43) {
return _0x447cdc+_0x4bae43;
}
,'GiWFX':"auto"
}
;
if(!isGifting)return;
const _0x105438=document["createElement"](_0x13e014["QHWrf"]),_0x3cb35e=_0x13e014["xjnxF"](Math["floor"](_0x13e014['edRrZ'](Math["random"](),0x12)),0x1);
_0x105438["src"]="../img/Anh ("+_0x3cb35e+").jpg?v="+Date.now(),_0x105438["className"]="falling-image";
const _0x420e9b=window['innerWidth'],_0x22d99d=_0x13e014["rWrpC"](_0x420e9b,0x258)?_0x13e014['ixYzk'](Math["random"](),0x28)+0x32:_0x13e014["YcUeu"](_0x13e014["ixYzk"](Math['random'](),0x3c),0x3c),_0x2bafae=_0x13e014["elZHP"](Math["random"](),_0x420e9b-_0x22d99d),_0x3ec843=_0x13e014["OYfZr"](Math["random"](),0x4)+0x4;
_0x105438['style']["left"]=_0x2bafae+'px',_0x105438["style"]["width"]=_0x13e014["nTNlJ"](_0x22d99d,'px'),_0x105438["style"]["height"]=_0x13e014["GiWFX"],_0x105438["style"]["animationDuration"]=_0x13e014["xjnxF"](_0x3ec843,'s'),document["body"]["appendChild"](_0x105438),_0x13e014["dIODG"](setTimeout,()=> {
if(_0x13e014['FijHK'](_0x13e014['EMEne'],"ClsUY"))_0x105438['remove']();
else {
const _0x1266b1=_0x3f7e6d["createElement"](_0x13e014["nhGWg"]);
_0x1266b1["innerHTML"]=_0x6ea9a5[_0x1e8d77['floor'](_0x13e014["YVhMY"](_0x4056c4["random"](),_0x32717f['length']))]||'💗',_0x1266b1["className"]=_0x13e014["QKnQL"];
const _0x51bf5=_0x13e014["OYfZr"](_0x21f115["random"]()*_0xe760bd['PI'],0x2),_0x5e5612=_0x13e014["YcUeu"](0x32,_0x13e014["elZHP"](_0x412009["random"](),0x96)),_0x98e3f6=_0x19027c["cos"](_0x51bf5)*_0x5e5612,_0x585990=_0x13e014["edRrZ"](_0x2557d1["sin"](_0x51bf5),_0x5e5612);
_0x1266b1["style"]['setProperty'](_0x13e014["uZVcB"],_0x98e3f6),_0x1266b1["style"]["setProperty"]("--y",_0x585990),_0x1266b1["style"]["left"]=_0x22225f+'px',_0x1266b1["style"]['top']=_0x13e014["YcUeu"](_0x346e6f,'px'),_0x1266b1['style']["fontSize"]=_0x13e014['WlULo'](_0x9a5a01['random']()*0x14,0xa)+'px',_0x1266b1["style"]['setProperty']("--r",_0x13e014['AgQDm'](_0x13e014["jYkcE"](_0x13e014['rzwBA'](_0x5430f1["random"](),0x168),0xb4),_0x13e014["SAobG"])),_0x23da4d['body']["appendChild"](_0x1266b1),_0x13e014['dIODG'](_0xc55a8f,()=> {
_0x1266b1["remove"]();
}
,0x3e8);
}
}
,_0x13e014['elZHP'](_0x3ec843,0x3e8));
}
function createFallingMessage() {
const _0x58f579= {
'jIXHT':'div','ftZxV':function(_0x488056,_0x23318a) {
return _0x488056*_0x23318a;
}
,'TIDGq':"#ff69b4",'ihoME':"#9370db",'omArg':"#e6e6fa",'NzrMD':'#40e0d0','MSXAd':'#afeeee','iRPlb':"#ff8c00",'rUaLq':"#e0ffff",'SAgZk':"#ffc0cb",'IPqwg':function(_0x2fd892,_0x51b1ef) {
return _0x2fd892-_0x51b1ef;
}
,'axIqW':function(_0x52ccb4,_0x3224d6) {
return _0x52ccb4+_0x3224d6;
}
,'wnFSy':function(_0x1e8b1a,_0x444ed1) {
return _0x1e8b1a*_0x444ed1;
}
,'RnpdE':function(_0x9b1a75,_0x2ba47d) {
return _0x9b1a75+_0x2ba47d;
}
,'NEvTY':function(_0x3d4e8a,_0x7e4bf) {
return _0x3d4e8a+_0x7e4bf;
}
}
;
if(!isMessaging)return;
const _0x449b73=document["createElement"](_0x58f579["jIXHT"]);
_0x449b73["className"]="falling-message",_0x449b73["innerText"]=messages[Math['floor'](_0x58f579['ftZxV'](Math['random'](),messages['length']))];
const _0x4ede35=[ {
'text':_0x58f579["TIDGq"],'border':"#ffb6c1"
}
, {
'text':_0x58f579["ihoME"],'border':_0x58f579["omArg"]
}
, {
'text':_0x58f579["NzrMD"],'border':_0x58f579['MSXAd']
}
, {
'text':_0x58f579['iRPlb'],'border':"#ffe4b5"
}
, {
'text':"#20b2aa",'border':_0x58f579["rUaLq"]
}
, {
'text':"#ff1493",'border':_0x58f579["SAgZk"]
}
],_0x5e63f3=_0x4ede35[Math["floor"](Math["random"]()*_0x4ede35['length'])],_0x2db08b=window["innerWidth"],_0x2c4448=0x14,_0x5b6c1a=_0x58f579['ftZxV'](Math["random"](),_0x58f579["IPqwg"](_0x2db08b,0xb4)-_0x58f579["ftZxV"](_0x2c4448,0x2))+_0x2c4448,_0x7ae6bb=_0x58f579["axIqW"](_0x58f579["wnFSy"](Math["random"](),0x5),0x5),_0x37d4bc=_0x2db08b<0x258?_0x58f579["RnpdE"](_0x58f579["ftZxV"](Math["random"](),0x4),0xe):Math["random"]()*0x6+0x10;
_0x449b73["style"]["left"]=_0x58f579['axIqW'](Math["max"](_0x2c4448,_0x5b6c1a),'px'),_0x449b73["style"]["fontSize"]=_0x58f579["RnpdE"](_0x37d4bc,'px'),_0x449b73["style"]['color']=_0x5e63f3['text'],_0x449b73["style"]['borderColor']=_0x5e63f3['border'],_0x449b73["style"]["animationDuration"]=_0x58f579["NEvTY"](_0x7ae6bb,'s'),document['body']["appendChild"](_0x449b73),setTimeout(()=> {
_0x449b73["remove"]();
}
,_0x7ae6bb*0x3e8);
}
document["addEventListener"]("click",_0xfc6b85=> {
createHearts(_0xfc6b85["clientX"],_0xfc6b85["clientY"]);
}
),document['addEventListener']("touchstart",_0x4ade8e=> {
const _0x244ec3= {
'VHpvr':function(_0x4e64a6,_0x28e490,_0x1c9ac2) {
return _0x4e64a6(_0x28e490,_0x1c9ac2);
}
}
;
_0x244ec3["VHpvr"](createHearts,_0x4ade8e["touches"][0x0]["clientX"],_0x4ade8e["touches"][0x0]["clientY"]);
}
);
function createHearts(_0x5f5ba3,_0x1dcd44) {
const _0x2a85fc= {
'yHJDG':'Anh yêu em ❤️','Ckpkd':function(_0x2c5f33,_0x585e35) {
return _0x2c5f33!==_0x585e35;
}
,'IapkR':"YhJMN",'MzcTg':"div",'fvLrz':function(_0x14089e,_0x4db753) {
return _0x14089e*_0x4db753;
}
,'MtDDt':'heart','LpLYj':function(_0x3bd364,_0x3e5afb) {
return _0x3bd364*_0x3e5afb;
}
,'XeWYv':function(_0x3045b6,_0x3c2de5) {
return _0x3045b6+_0x3c2de5;
}
,'ZvHKM':function(_0x304d26,_0x4d62fc) {
return _0x304d26*_0x4d62fc;
}
,'SQDZb':function(_0x46c440,_0x5bdf0e) {
return _0x46c440*_0x5bdf0e;
}
,'bRXWh':function(_0x261533,_0x2e0bcf) {
return _0x261533*_0x2e0bcf;
}
,'pbQLt':"--x",'ztFqT':"--y",'SxuTb':function(_0x32dde7,_0x50f788) {
return _0x32dde7+_0x50f788;
}
,'zJWfc':function(_0x42ec78,_0x21f885) {
return _0x42ec78*_0x21f885;
}
,'OjDNx':"--r",'eNHaR':function(_0x2b6566,_0xf12ada) {
return _0x2b6566+_0xf12ada;
}
,'RMAeV':function(_0x44e149,_0x5bc80d) {
return _0x44e149-_0x5bc80d;
}
,'Jqnxp':function(_0x3fc8d5,_0x5b76dc) {
return _0x3fc8d5*_0x5b76dc;
}
,'aoISW':function(_0x4a9160,_0x4a124c,_0x5eb01f) {
return _0x4a9160(_0x4a124c,_0x5eb01f);
}
}
,_0x563a8a=0xf,_0x16903c=Array["from"](explosionIcon)["filter"](_0x170777=>_0x170777["trim"]()!=='');
for(let _0x581744=0x0;
_0x581744<_0x563a8a;
_0x581744++) {
const _0x462731=document["createElement"](_0x2a85fc["MzcTg"]);
_0x462731['innerHTML']=_0x16903c[Math["floor"](_0x2a85fc["fvLrz"](Math["random"](),_0x16903c["length"]))]||'💗',_0x462731["className"]=_0x2a85fc['MtDDt'];
const _0x5bc541=_0x2a85fc["LpLYj"](_0x2a85fc["fvLrz"](Math['random'](),Math['PI']),0x2),_0x315243=_0x2a85fc["XeWYv"](0x32,_0x2a85fc['ZvHKM'](Math["random"](),0x96)),_0x553e58=_0x2a85fc["SQDZb"](Math["cos"](_0x5bc541),_0x315243),_0x70a1e7=_0x2a85fc['bRXWh'](Math["sin"](_0x5bc541),_0x315243);
_0x462731["style"]["setProperty"](_0x2a85fc["pbQLt"],_0x553e58),_0x462731["style"]["setProperty"](_0x2a85fc["ztFqT"],_0x70a1e7),_0x462731["style"]["left"]=_0x2a85fc['SxuTb'](_0x5f5ba3,'px'),_0x462731['style']["top"]=_0x2a85fc["XeWYv"](_0x1dcd44,'px'),_0x462731["style"]["fontSize"]=_0x2a85fc['XeWYv'](_0x2a85fc['zJWfc'](Math['random'](),0x14)+0xa,'px'),_0x462731["style"]["setProperty"](_0x2a85fc["OjDNx"],_0x2a85fc["eNHaR"](_0x2a85fc["RMAeV"](_0x2a85fc["Jqnxp"](Math['random'](),0x168),0xb4),"deg")),document["body"]["appendChild"](_0x462731),_0x2a85fc["aoISW"](setTimeout,()=> {
const _0x182e48= {
'KdQfg':"Error loading mess.txt:",'dZzqD':_0x2a85fc["yHJDG"]
}
;
_0x2a85fc["Ckpkd"]("YhJMN",_0x2a85fc["IapkR"])?(_0x45cb32["error"](AameEH['KdQfg'],_0x169892),_0x42ccba=[AameEH["dZzqD"]]):_0x462731['remove']();
}
,0x3e8);
}
}
const popSound=document['getElementById']("pop-sound");
window['addEventListener']("mousedown",()=> {
if(popSound) {
const _0x45c713=popSound['cloneNode'](!![]);
_0x45c713["play"]();
}
}
,!![]);
