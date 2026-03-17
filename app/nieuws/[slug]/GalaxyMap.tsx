'use client'

import { useEffect, useRef, useState } from 'react'

interface ArticleNode {
  slug:     string
  title:    string
  category: string
  catColor: string
  emoji:    string
}

interface DrawNode {
  slug:     string
  title:    string
  category: string
  x:        number
  y:        number
  ox:       number
  oy:       number
  r:        number
  vx:       number
  vy:       number
}

interface Props {
  currentSlug: string
}

const CAT_COLORS: Record<string, string> = {
  'james-webb':    '#7aadff',
  'kosmologie':    '#c080ff',
  'cosmology':     '#c080ff',
  'missies':       '#3dcfdf',
  'missions':      '#3dcfdf',
  'mars':          '#ff8a60',
  'sterrenkijken': '#d4a84b',
  'observing':     '#d4a84b',
  'educatie':      '#3ddf90',
  'education':     '#3ddf90',
}

const CAT_EMOJI: Record<string, string> = {
  'james-webb':    '🔭',
  'kosmologie':    '💫',
  'missies':       '🚀',
  'mars':          '🔴',
  'sterrenkijken': '☄️',
  'educatie':      '⭐',
}

export default function GalaxyMap({ currentSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef  = useRef<DrawNode[]>([])
  const rafRef    = useRef<number>(0)
  const frameRef  = useRef<number>(0)
  const hovRef    = useRef<string>('')

  const [articles, setArticles] = useState<ArticleNode[]>([])
  const [hovered,  setHovered]  = useState<DrawNode | null>(null)
  const [tooltip,  setTooltip]  = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: ArticleNode[]) => setArticles(data.slice(0, 28)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!articles.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width  = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const currentCat = articles.find(a => a.slug === currentSlug)?.category ?? ''

    const nodes: DrawNode[] = articles.map((a, i) => {
      const isCurrent = a.slug === currentSlug
      const isRelated = a.category === currentCat && !isCurrent
      const angle     = (i / articles.length) * Math.PI * 2
      const dist      = isCurrent ? 0 : (isRelated ? 0.28 : 0.42) * Math.min(W, H)
      const ox        = isCurrent ? W / 2 : W / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 80
      const oy        = isCurrent ? H / 2 : H / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 60
      const r         = isCurrent ? 14 : isRelated ? 8 : 4
      return { slug: a.slug, title: a.title, category: a.category, x: ox, y: oy, ox, oy, r, vx: (Math.random()-.5)*.12, vy: (Math.random()-.5)*.08 }
    })
    nodesRef.current = nodes

    const bgStars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.8 + 0.2, a: Math.random() * 0.5 + 0.1,
      s: Math.random() * 0.006 + 0.002, p: Math.random() * Math.PI * 2,
    }))

    function draw() {
      frameRef.current++
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#03060f'
      ctx.fillRect(0, 0, W, H)

      const vig = ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.8)
      vig.addColorStop(0,'transparent')
      vig.addColorStop(1,'rgba(3,6,15,0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0,0,W,H)

      bgStars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(180,210,255,${s.a + .25*Math.sin(s.p + frameRef.current*s.s)})`
        ctx.fill()
      })

      nodes.forEach(n => {
        if (n.slug === currentSlug) return
        n.x += n.vx; n.y += n.vy
        if (Math.abs(n.x-n.ox)>18) n.vx*=-1
        if (Math.abs(n.y-n.oy)>12) n.vy*=-1
      })

      const cur = nodes.find(n => n.slug === currentSlug)
      const hovSlug = hovRef.current

      nodes.forEach(n => {
        if (n.slug===currentSlug || n.category!==currentCat || !cur) return
        const isHov = hovSlug===n.slug
        ctx.beginPath(); ctx.moveTo(cur.x,cur.y); ctx.lineTo(n.x,n.y)
        ctx.strokeStyle = isHov ? 'rgba(125,211,252,0.6)' : 'rgba(125,211,252,0.15)'
        ctx.lineWidth=isHov?1.5:.8; ctx.setLineDash(isHov?[]:[4,6])
        ctx.shadowBlur=isHov?8:0; ctx.shadowColor='#7dd3fc'; ctx.stroke()
        ctx.setLineDash([]); ctx.shadowBlur=0
        if (isHov) {
          const t=(frameRef.current*.012)%1
          ctx.beginPath(); ctx.arc(cur.x+(n.x-cur.x)*t, cur.y+(n.y-cur.y)*t, 2.5, 0, Math.PI*2)
          ctx.fillStyle='rgba(125,211,252,0.9)'; ctx.shadowBlur=8; ctx.shadowColor='#7dd3fc'; ctx.fill(); ctx.shadowBlur=0
        }
      })

      nodes.forEach(n => {
        const isCurrent = n.slug===currentSlug
        const isRelated = n.category===currentCat && !isCurrent
        const isHov     = hovSlug===n.slug
        const color     = CAT_COLORS[n.category] ?? '#7aadff'
        const pulse     = 1+.1*Math.sin(frameRef.current*.05+n.ox)
        const r: number = n.r * (isCurrent ? pulse : isHov ? 1.4 : 1)

        if (isCurrent||isRelated||isHov) {
          const grd=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*(isCurrent?4:3))
          grd.addColorStop(0,color+(isCurrent?'55':'30')); grd.addColorStop(1,'transparent')
          ctx.beginPath(); ctx.arc(n.x,n.y,r*(isCurrent?4:3),0,Math.PI*2); ctx.fillStyle=grd; ctx.fill()
        }

        const cg=ctx.createRadialGradient(n.x-r*.2,n.y-r*.2,0,n.x,n.y,r)
        cg.addColorStop(0,'white'); cg.addColorStop(.4,color); cg.addColorStop(1,color+'88')
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fillStyle=cg
        ctx.globalAlpha=isCurrent?1:isRelated?.9:.35
        ctx.shadowBlur=isCurrent?20:isHov?14:6; ctx.shadowColor=color; ctx.fill()
        ctx.shadowBlur=0; ctx.globalAlpha=1

        if (isCurrent) {
          const spike = r * 3
          ctx.strokeStyle=color+'55'; ctx.lineWidth=.8
          const dirs: Array<[number,number]> = [[1,0],[0,1]]
          dirs.forEach(([dx,dy]) => {
            ctx.beginPath()
            ctx.moveTo(n.x-dx*spike, n.y-dy*spike)
            ctx.lineTo(n.x+dx*spike, n.y+dy*spike)
            ctx.stroke()
          })
        }

        if (isCurrent||isHov||(isRelated&&n.r>=8)) {
          ctx.font=isCurrent?`600 11px 'DM Mono',monospace`:`400 9px 'DM Mono',monospace`
          ctx.textAlign='center'
          ctx.fillStyle=isCurrent?'#f1f5f9':isHov?'#cbd5e1':'#64748b'
          ctx.fillText(n.title.length>28?n.title.slice(0,26)+'…':n.title, n.x, n.y+r+14)
        }
      })

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [articles, currentSlug])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect=canvasRef.current!.getBoundingClientRect()
    const mx=e.clientX-rect.left, my=e.clientY-rect.top
    let found: DrawNode|null = null
    for (const n of nodesRef.current) {
      if (n.slug===currentSlug) continue
      const dx=n.x-mx, dy=n.y-my
      if (Math.sqrt(dx*dx+dy*dy)<Math.max(n.r+8,16)) { found=n; break }
    }
    hovRef.current = found?.slug ?? ''
    setHovered(found)
    setTooltip({x:e.clientX-rect.left, y:e.clientY-rect.top})
    if (canvasRef.current) canvasRef.current.style.cursor=found?'pointer':'default'
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect=canvasRef.current!.getBoundingClientRect()
    const mx=e.clientX-rect.left, my=e.clientY-rect.top
    for (const n of nodesRef.current) {
      if (n.slug===currentSlug) continue
      const dx=n.x-mx, dy=n.y-my
      if (Math.sqrt(dx*dx+dy*dy)<Math.max(n.r+8,16)) { window.location.href=`/nieuws/${n.slug}`; return }
    }
  }

  if (!articles.length) return null
  const currentCat = articles.find(a=>a.slug===currentSlug)?.category??''
  const related    = articles.filter(a=>a.category===currentCat&&a.slug!==currentSlug)

  return (
    <div style={{marginTop:80,borderTop:'1px solid #1c2035'}}>
      <div style={{padding:'28px 0 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.58rem',letterSpacing:'0.22em',textTransform:'uppercase',color:'#4a5278',display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{color:CAT_COLORS[currentCat]??'#7aadff'}}>✦</span>
            Sterrenveld — Verken gerelateerde artikelen
          </div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'1.1rem',color:'#7a86a8'}}>
            {related.length} gerelateerde artikelen in <span style={{color:CAT_COLORS[currentCat]??'#7aadff'}}>{currentCat}</span>
          </div>
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.55rem',color:'#2a3050',letterSpacing:'0.1em',textAlign:'right',lineHeight:1.8}}>
          HOVER om te verkennen<br/>KLIK om te navigeren
        </div>
      </div>
      <div style={{position:'relative',width:'100%',height:380,borderRadius:8,overflow:'hidden',border:'1px solid #1c2035'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}
          onMouseMove={handleMouseMove} onMouseLeave={()=>{hovRef.current='';setHovered(null)}} onClick={handleClick} />
        {hovered && (
          <div style={{position:'absolute',left:Math.min(tooltip.x+14,(canvasRef.current?.offsetWidth??400)-220),top:Math.max(tooltip.y-60,8),background:'rgba(7,8,13,0.95)',border:`1px solid ${CAT_COLORS[hovered.category]??'#1c2035'}55`,borderRadius:8,padding:'10px 14px',pointerEvents:'none',maxWidth:210,backdropFilter:'blur(8px)',zIndex:10}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.52rem',letterSpacing:'0.15em',textTransform:'uppercase',color:CAT_COLORS[hovered.category]??'#7aadff',marginBottom:5}}>
              {CAT_EMOJI[hovered.category]??'🌌'} {hovered.category}
            </div>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'0.92rem',color:'#f1f5f9',lineHeight:1.3}}>{hovered.title}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'#4a5278',marginTop:6}}>klik om te lezen →</div>
          </div>
        )}
        <div style={{position:'absolute',bottom:12,left:12,fontFamily:'DM Mono,monospace',fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:CAT_COLORS[currentCat]??'#7aadff',background:'rgba(7,8,13,0.8)',border:`1px solid ${CAT_COLORS[currentCat]??'#1c2035'}44`,padding:'5px 10px',borderRadius:4,display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:CAT_COLORS[currentCat]??'#7aadff',boxShadow:`0 0 6px ${CAT_COLORS[currentCat]??'#7aadff'}`}} />
          Jij bent hier
        </div>
      </div>
    </div>
  )
}
