import React from 'react';
import {ArtBox,C,Copy,HEAD,Label,TextBlock,Title} from './system';
export const Safe:React.FC=()=> <><TextBlock><Label dark>Güvenli bir deneme alanı.</Label><Title dark lines={['KENDİN','OLABİLDİĞİN','BİR YER.']} size={127} accent={2}/><Copy dark>Paylaşmak gönüllü.<br/>Geri bildirim davranışa yönelik.<br/>Program terapi değildir.</Copy></TextBlock><ArtBox><div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:85,color:C.ink,fontFamily:HEAD}}>SEN.</div></ArtBox></>;
