const OWNER="Stmic75", REPO="3d-tisk", BRANCH="main";
const categories=["NAŠE REALIZACE","DEKORACE","Dekorace","AUTO_MOTO","Auto Moto","FIGURKY","Figurky","KVĚTINÁČE","Květináče","SVĚTLA","Světla","ZBRANĚ","Zbraně"];
const $=id=>document.getElementById(id);

function showCategories(){
  $("title").textContent="Vyberte kategorii";
  $("subtitle").textContent="Všechny modely jsou načítány přímo z našeho GitHub katalogu.";
  $("categories").classList.remove("hidden"); $("back").classList.add("hidden");
  $("models").innerHTML=""; $("status").textContent="";
  $("categories").innerHTML=categories.map(([id,label])=>`<button onclick="loadModels('${id}','${label}')">${label}<span>→</span></button>`).join("");
}
async function loadModels(folder,label){
  $("title").textContent=label;
  $("subtitle").textContent="Všechny modely v kategorii";
  $("categories").classList.add("hidden"); $("back").classList.remove("hidden");
  $("models").innerHTML=""; $("status").textContent="Načítám modely a fotografie…";

  try{
    // One recursive GitHub request avoids API rate-limit problems from
    // making a separate request for every model folder.
    const treeUrl=`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const res=await fetch(treeUrl,{headers:{Accept:"application/vnd.github+json"}});
    if(!res.ok) throw new Error("GitHub tree API");
    const data=await res.json();

    const prefix=folder+"/";
    const paths=(data.tree||[]).filter(x=>x.type==="blob" && x.path.startsWith(prefix));
    const modelNames=[...new Set(paths
      .map(x=>x.path.slice(prefix.length))
      .filter(rest=>rest.includes("/"))
      .map(rest=>rest.split("/")[0])
      .filter(name=>name && name!==".gitkeep"))]
      .sort((a,b)=>a.localeCompare(b,"cs"));

    const cards=modelNames.map(name=>{
      const modelPrefix=prefix+name+"/";
      const imageFile=paths
        .filter(x=>x.path.startsWith(modelPrefix) && /\.(webp|png|jpe?g|gif)$/i.test(x.path))
        .sort((a,b)=>{
          const score=p=>/promo|cover|main|preview|thumb|náhled|nahled/i.test(p)?0:1;
          return score(a.path)-score(b.path);
        })[0];

      const image=imageFile
        ? `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${imageFile.path.split("/").map(encodeURIComponent).join("/")}`
        : null;
      return {name,image};
    });

    $("status").textContent=cards.length+" modelů";
    $("models").innerHTML=cards.map(x=>{
      const subject=encodeURIComponent("Poptávka – "+x.name);
      const img=x.image
        ? `<img class="model-image" src="${esc(x.image)}" alt="${esc(x.name)}" loading="lazy">`
        : `<div class="photo-placeholder"><span>${label.toUpperCase()}</span></div>`;
      return `<article class="card" tabindex="0" role="button" data-name="${esc(x.name)}" data-cat="${esc(label)}" data-image="${esc(x.image||"")}">
        <div class="photo">${img}</div>
        <div class="card-body"><h3 title="${esc(x.name)}">${esc(x.name)}</h3>
        <p>Individuální velikost a provedení</p>
        <div class="card-foot"><span class="price">Cena na poptávku</span>
        <a class="request" href="mailto:nebudlama007@seznam.cz?subject=${subject}" onclick="event.stopPropagation()">Poptat →</a></div></div>
      </article>`;
    }).join("");
  }catch(e){
    console.error(e);
    $("status").textContent="Modely se nepodařilo načíst. Zkontrolujte GitHub Pages nebo připojení.";
  }
}
function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function showHome(){window.scrollTo({top:0,behavior:"smooth"});showCategories()}
showCategories();

const lightbox=$("lightbox"), lbTitle=$("lightboxTitle"), lbCategory=$("lightboxCategory");
const lbImage=$("lightboxImage"), downloadImage=$("downloadImage"), mailRequest=$("mailRequest");
function openLightbox(name, category, imageUrl){
  lbTitle.textContent=name; lbCategory.textContent=category;
  lbImage.style.backgroundImage="";
  lbImage.innerHTML=imageUrl
    ? `<img src="${esc(imageUrl)}" alt="${esc(name)}">`
    : `<span>NÁHLED MODELU<br><small>Obrázek zatím není ve složce modelu.</small></span>`;
  if(imageUrl){
    downloadImage.href=imageUrl;
    downloadImage.download=name.replace(/[\\/:*?"<>|]/g,"_")+".webp";
  }else{
    downloadImage.removeAttribute("href");
    downloadImage.removeAttribute("download");
  }
  downloadImage.classList.toggle("disabled",!imageUrl);
  mailRequest.href="mailto:nebudlama007@seznam.cz?subject="+encodeURIComponent("Poptávka – "+name);
  lightbox.classList.remove("hidden");
  document.body.style.overflow="hidden";
}
function closeLightbox(){
  lightbox.classList.add("hidden"); document.body.style.overflow="";
  lbImage.style.backgroundImage="";
}
$("closeLightbox").addEventListener("click",closeLightbox);
lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!lightbox.classList.contains("hidden"))closeLightbox()});
const observer=new MutationObserver(()=>{
  document.querySelectorAll("#models .card").forEach(card=>{
    if(card.dataset.bound)return;
    card.dataset.bound="1";
    card.addEventListener("click",()=>openLightbox(card.dataset.name,card.dataset.cat,card.dataset.image));
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openLightbox(card.dataset.name,card.dataset.cat,card.dataset.image)}});
  });
});
observer.observe($("models"),{childList:true});
