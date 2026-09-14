import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, DISPLAY, Kicker, Route, SceneShell} from './shared';

export type WeekData = {number:number; module:string; title:string; copy:string; output:string};

export const Week: React.FC<WeekData> = ({number,module,title,copy,output}) => {
  const frame = useCurrentFrame();
  const {fps,width,height,durationInFrames} = useVideoConfig();
  const portrait = height > width;
  return <SceneShell>
    <div style={{position:'absolute',left:portrait?-36:70,top:portrait?250:205,color:'rgba(236,0,63,.08)',fontFamily:DISPLAY,fontSize:portrait?520:520,lineHeight:.75,letterSpacing:'-.12em',translate:interpolate(frame,[0,durationInFrames],['-45px 0px','30px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{String(number).padStart(2,'0')}</div>
    <div style={{position:'relative',display:'grid',gridTemplateColumns:portrait?'1fr':'400px 1fr',gap:portrait?40:100,alignItems:'center',height:'100%',paddingBottom:portrait?120:70}}>
      <div style={{fontFamily:DISPLAY,fontSize:portrait?190:340,lineHeight:.75,letterSpacing:'-.1em',color:COLORS.red,opacity:interpolate(frame,[0,.55*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[0,.7*fps],['-90px 0px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>{String(number).padStart(2,'0')}</div>
      <div>
        <Kicker>{module}</Kicker>
        <div style={{fontFamily:DISPLAY,fontSize:portrait?78:105,lineHeight:.9,letterSpacing:'-.055em',textTransform:'uppercase',maxWidth:1000,opacity:interpolate(frame,[.2*fps,.9*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[.2*fps,.9*fps],['0px 65px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>{title}</div>
        <div style={{maxWidth:850,marginTop:portrait?42:34,color:COLORS.muted,fontSize:portrait?31:26,lineHeight:1.55,opacity:interpolate(frame,[.55*fps,1.2*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{copy}</div>
        <div style={{display:'inline-flex',marginTop:portrait?34:28,padding:'14px 20px',border:'2px solid rgba(16,44,67,.15)',borderRadius:999,fontSize:portrait?21:17,fontWeight:800,opacity:interpolate(frame,[.8*fps,1.35*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>Çıktı · {output}</div>
      </div>
    </div>
    <Route active={number}/>
  </SceneShell>;
};

export const weeks: WeekData[] = [
  {number:1,module:'Yönünü Gör · I',title:'Kendimi tanımaya nereden başlarım?',copy:'Güçlü yönlerini sıfatlarla değil, davranışsal kanıtlarla gör. Sana yön veren değerleri fark et.',output:'Güçlü yön ve değer haritası'},
  {number:2,module:'Yönünü Gör · II',title:'Hedefi eyleme çevirmek.',copy:'Hedefini küçük, tarihli ve kontrol edilebilir adımlara böl. İlk 48 saati ve engel planını kur.',output:'90 günlük hedef ve engel planı'},
  {number:3,module:'Kendini İfade Et · I',title:'Dinlemek ve net konuşmak.',copy:'Aktif dinleme, açık soru, ben dili ve saygılı sınır yöntemlerini güvenli senaryolarda prova et.',output:'İletişim senaryosu uygulama notu'},
  {number:4,module:'Kendini İfade Et · II',title:'Güvenli ortamda kendini ifade etmek.',copy:'İki dakikalık konuşmanı yapılandır; küçük grupta dene; davranışına yönelik geri bildirim al.',output:'Konuşma ve geri bildirim rubriği'},
  {number:5,module:'Düzenini Kur · I',title:'Zamanımı görmek.',copy:'İdeal haftayı değil, gerçek haftanı incele. Örüntüyü gör ve tek bir davranış deneyi seç.',output:'Zaman günlüğü ve davranış deneyi'},
  {number:6,module:'Düzenini Kur · II',title:'Sorumluluk ve sonraki adım.',copy:'Kontrol, etki ve destek alanlarını ayır. Önündeki 30 gün için gerçekçi bir sözleşme hazırla.',output:'Eylem sözleşmesi ve destek haritası'},
];
