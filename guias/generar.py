import os, sys
# Genera las páginas de /guias. Uso: python3 guias/generar.py guias
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
SITE = "RoGuías"
ARTS = [
 dict(slug="evento-halloween-roblox-2026", emoji="🎃", color="#ffe3c7", tag="Evento", destacado=True,
  title="Evento de Halloween Roblox 2026",
  desc="Todo lo que necesitas para aprovechar los eventos de Halloween de este octubre en Roblox.",
  body="""
<p>¡Llegó octubre y Roblox se llena de calabazas, fantasmas y objetos de edición limitada! Muchos de los juegos más populares lanzan actualizaciones de Halloween con misiones, monedas especiales y recompensas que solo están disponibles por unas semanas.</p>
<div class="box"><b>Actualizaremos esta guía</b> conforme se anuncien los eventos oficiales y las recompensas de cada juego.</div>
<h2>Qué esperar este Halloween</h2>
<ul>
<li><b>Actualizaciones temáticas</b> en juegos como Grow a Garden, Adopt Me!, Brookhaven y más: mapas decorados, misiones y mascotas o semillas de temporada.</li>
<li><b>Objetos gratis para tu avatar:</b> revisa el Marketplace filtrando por precio “Gratis”; en temporada suelen aparecer accesorios de Halloween.</li>
<li><b>Monedas de evento</b> (dulces, calabazas, almas…) que se cambian por recompensas exclusivas antes de que termine el evento.</li>
</ul>
<!--AD-->
<h2>Consejos para sacarle el máximo provecho</h2>
<ol>
<li>Entra todos los días: muchos eventos dan recompensas diarias o por racha.</li>
<li>Gasta tus monedas de evento antes de que termine: normalmente desaparecen o dejan de servir.</li>
<li>Sigue los grupos oficiales y las redes de tus juegos favoritos para enterarte de códigos y fechas.</li>
</ol>
<div class="box warn"><b>Cuidado:</b> en temporada de eventos aumentan las estafas de “objetos gratis” y “Robux gratis”. Nunca escribas tu contraseña fuera de roblox.com. <a href="robux-gratis-estafas.html">Aprende a reconocerlas aquí</a>.</div>
"""),
 dict(slug="robux-gratis-formas-oficiales", emoji="💰", color="#fff4c2", tag="Guías",
  title="Robux gratis: las formas reales y oficiales de conseguirlos",
  desc="Sin generadores ni estafas: así es como de verdad se consiguen Robux sin pagar.",
  body="""
<p>No existe ningún “generador de Robux”. Pero sí hay formas oficiales de conseguir Robux sin gastar tu dinero. Requieren algo de tiempo o creatividad, pero funcionan y no ponen en riesgo tu cuenta.</p>
<h2>1. Crea y vende ropa o accesorios</h2>
<p>Con Roblox Studio puedes diseñar camisetas, pantalones o accesorios (UGC) y venderlos en el Marketplace. Cada venta te deja una parte en Robux.</p>
<h2>2. Crea un juego con Game Passes</h2>
<p>Si haces un juego, puedes vender pases (por ejemplo, velocidad doble o un área VIP). <a href="crear-juego-roblox-studio.html">Aquí te enseñamos a crear tu primer juego</a>.</p>
<!--AD-->
<h2>3. Únete a un grupo que pague a sus miembros</h2>
<p>Los dueños de grupos pueden repartir Robux a sus miembros (por ejemplo, a quienes ayudan a construir o moderar). Solo acepta pagos dentro de Roblox, nunca des tu contraseña.</p>
<h2>4. Tarjetas de regalo</h2>
<p>Pídelas como regalo de cumpleaños o fiestas. Algunos programas de recompensas de tiendas o empresas a veces ofrecen tarjetas de Roblox; usa solo programas conocidos y oficiales.</p>
<h2>5. Programa de afiliados de Roblox</h2>
<p>Si compartes enlaces de juegos y nuevas personas se registran con ellos, Roblox puede darte Robux cuando ellos hagan compras (revisa las condiciones vigentes en el sitio oficial).</p>
<div class="box warn"><b>Regla de oro:</b> si una página te pide tu contraseña, descargar algo o “verificar que eres humano” para darte Robux, es una estafa. <a href="robux-gratis-estafas.html">Así se reconocen</a>.</div>
"""),
 dict(slug="robux-gratis-estafas", emoji="🛡️", color="#fde2e1", tag="Seguridad",
  title="¿Robux gratis? Cómo reconocer las estafas en Roblox",
  desc="Las trampas más comunes para robar cuentas y cómo protegerte.",
  body="""
<p>Si buscas “Robux gratis” vas a encontrar cientos de páginas que prometen regalarte miles. Casi todas son estafas. Aquí te explicamos cómo funcionan y cómo evitarlas.</p>
<h2>Las estafas más comunes</h2>
<ul>
<li><b>Generadores de Robux:</b> te piden tu usuario y contraseña, o que completes “verificaciones humanas”. Los Robux nunca llegan.</li>
<li><b>Links falsos de inicio de sesión:</b> páginas que copian el diseño de Roblox para robar tu contraseña.</li>
<li><b>“Pega este código en la consola”:</b> te hacen copiar un script en el navegador que entrega tu sesión a otra persona.</li>
<li><b>Intercambios “confiables”:</b> alguien te pide que le des tus objetos primero y luego desaparece.</li>
</ul>
<!--AD-->
<h2>Cómo protegerte</h2>
<ol>
<li>Activa la <b>verificación en dos pasos</b> en la configuración de seguridad de tu cuenta.</li>
<li>Escribe tu contraseña solo en <b>roblox.com</b> o en la app oficial.</li>
<li>Nunca compartas tu contraseña ni códigos de verificación, ni con amigos.</li>
<li>Desconfía de cualquier oferta que parezca demasiado buena.</li>
</ol>
<div class="box warn"><b>Recuerda:</b> los Robux solo se obtienen de forma oficial: comprándolos, con una membresía o ganándolos al vender tus propias creaciones.</div>
"""),
 dict(slug="grow-a-garden-principiantes", emoji="🌱", color="#dff5e3", tag="Guías",
  title="Grow a Garden: guía para principiantes",
  desc="Qué plantar primero, cómo ganar dinero rápido y errores que debes evitar.",
  body="""
<p><i>Grow a Garden</i> es uno de los juegos más populares de Roblox. La idea es simple: plantas semillas, esperas a que crezcan, cosechas y vendes para comprar semillas mejores.</p>
<h2>Tus primeros minutos</h2>
<ul>
<li>Empieza con semillas baratas que crecen rápido: te dan dinero constante.</li>
<li>Planta en todo tu terreno; un espacio vacío es dinero que no ganas.</li>
<li>Vuelve a revisar la tienda seguido: el inventario de semillas cambia cada cierto tiempo.</li>
</ul>
<!--AD-->
<h2>Mutaciones y clima</h2>
<p>Algunos eventos de clima pueden darle mutaciones a tus plantas, lo que aumenta mucho su valor de venta. Si hay un evento activo, ¡conéctate y deja tu jardín lleno!</p>
<h2>Mascotas</h2>
<p>Las mascotas dan bonificaciones pasivas (crecimiento más rápido, mejores cosechas, etc.). Vale la pena ahorrar para un huevo cuando ya tengas ingresos estables.</p>
<div class="box"><b>Consejo:</b> no vendas todo de inmediato. Las frutas con mutaciones raras valen mucho más; revisa su valor antes de venderlas.</div>
"""),
 dict(slug="crear-juego-roblox-studio", emoji="🛠️", color="#e1ebfd", tag="Creadores",
  title="Cómo crear tu primer juego en Roblox Studio",
  desc="Desde instalar Studio hasta publicar tu primer obby.",
  body="""
<p>Cualquier persona con una cuenta de Roblox puede crear juegos gratis usando <b>Roblox Studio</b>. Así puedes empezar.</p>
<h2>1. Instala Roblox Studio</h2>
<p>Descárgalo desde la página oficial de creadores de Roblox e inicia sesión con tu cuenta.</p>
<h2>2. Elige una plantilla</h2>
<p>Para tu primer proyecto usa la plantilla <b>Baseplate</b> u <b>Obby</b>. Ya trae lo básico para empezar a construir.</p>
<!--AD-->
<h2>3. Construye</h2>
<ul>
<li>Usa <b>Part</b> para agregar bloques y las herramientas Mover, Escalar y Rotar.</li>
<li>Activa <b>Anchored</b> en las piezas para que no se caigan.</li>
<li>Prueba tu juego con el botón <b>Play</b> todas las veces que quieras.</li>
</ul>
<h2>4. Un script sencillo</h2>
<p>Agrega un Script dentro de una pieza para que elimine al jugador que la toque (ideal para un obby):</p>
<pre style="background:var(--bg);padding:12px;border-radius:8px;overflow:auto"><code>script.Parent.Touched:Connect(function(hit)
  local hum = hit.Parent:FindFirstChild("Humanoid")
  if hum then hum.Health = 0 end
end)</code></pre>
<h2>5. Publica</h2>
<p>Ve a <b>Archivo → Publicar en Roblox</b>, ponle nombre y descripción, y compártelo con tus amigos.</p>
"""),
 dict(slug="consejos-seguridad-cuenta", emoji="🔐", color="#f1e3fb", tag="Seguridad",
  title="7 consejos para mantener tu cuenta de Roblox segura",
  desc="Configuraciones que todos los jugadores (y padres) deberían activar.",
  body="""
<p>Perder una cuenta con años de objetos es terrible. Estos pasos toman cinco minutos y la protegen muchísimo.</p>
<ol>
<li><b>Verificación en dos pasos:</b> agrega una capa extra al iniciar sesión.</li>
<li><b>Correo verificado:</b> sirve para recuperar la cuenta si olvidas la contraseña.</li>
<li><b>Contraseña única:</b> no uses la misma de otros sitios.</li>
</ol>
<!--AD-->
<ol start="4">
<li><b>Revisa tus sesiones:</b> en Configuración puedes cerrar sesión en todos los dispositivos.</li>
<li><b>No instales “exploits”:</b> muchos programas de trucos contienen virus que roban cuentas.</li>
<li><b>Controles parentales:</b> los padres pueden limitar el chat y los gastos.</li>
<li><b>Reporta:</b> usa el botón de reportar si alguien te pide datos personales.</li>
</ol>
<div class="box">Si te roban la cuenta, contacta al soporte oficial de Roblox lo antes posible.</div>
"""),
]

def head(title, desc, root):
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="icon" href="{root}favicon-32x32.png"><link rel="stylesheet" href="{root}guias/estilos.css">
</head><body>
<header class="top"><div class="in"><a class="logo" href="{root}guias/">Ro<b>Guías</b></a>
<nav><a href="{root}guias/">Inicio</a><a href="{root}guias/robux-gratis-estafas.html">Seguridad</a><a href="{root}guias/grow-a-garden-principiantes.html">Guías</a><a href="{root}guias/crear-juego-roblox-studio.html">Creadores</a></nav></div></header>
<div class="ad-top"><div class="ad" data-slot="arriba"></div></div>
"""

def side(root, skip=None):
    links = "".join(f'<a href="{root}guias/{a["slug"]}.html">{a["emoji"]} {a["title"]}</a>' for a in ARTS if a["slug"] != skip)
    return f"""<aside class="side"><div class="sticky"><div class="list"><h3>Más leídos</h3>{links}</div>
<div class="ad tall" data-slot="lateral"></div></div></aside>"""

def foot(root):
    return f"""<div style="max-width:1120px;margin:auto;padding:0 16px"><div class="ad" data-slot="abajo"></div></div>
<footer>© 2026 {SITE} · Sitio de fans, no afiliado ni respaldado por Roblox Corporation. · <a href="{root}privacy/">Privacidad</a><br>
Este sitio muestra anuncios de terceros (Google AdSense) que pueden usar cookies.</footer>
<script src="{root}guias/anuncios.js"></script></body></html>
"""

root = "/"
cards = []
destacado = ""
for i, a in enumerate(ARTS):
    cards.append(f"""<a class="card" href="{a['slug']}.html"><div class="img" style="background:{a['color']}">{a['emoji']}</div>
<div class="body"><span class="tag">{a['tag']}</span><h2>{a['title']}</h2><p>{a['desc']}</p></div></a>""")
    if a.get("destacado"):
        destacado = cards.pop().replace('class="card"', 'class="card destacado"')
    if i == 2:
        cards.append('<div class="ad" data-slot="medio" style="grid-column:1/-1;margin:0"></div>')
    body = a["body"].replace("<!--AD-->", '<div class="ad" data-slot="medio"></div>')
    page = head(f"{a['title']} | {SITE}", a["desc"], root) + f"""<div class="wrap"><main><article>
<span class="tag">{a['tag']}</span><h1>{a['title']}</h1><div class="meta">Por el equipo de {SITE} · Lectura de 3 min</div>
{body}
<div class="ad" data-slot="medio"></div>
<p><a href="./">← Volver a todas las guías</a></p></article></main>{side(root, a['slug'])}</div>""" + foot(root)
    open(os.path.join(OUT, a["slug"] + ".html"), "w").write(page)

index = head(f"{SITE} — Guías, noticias y consejos de Roblox", "Guías, trucos y consejos de seguridad para jugadores de Roblox.", root) + f"""<div class="wrap"><main>
<section class="hero"><h1>Guías y consejos de Roblox</h1><p>Aprende a jugar mejor, crear tus propios juegos y mantener tu cuenta segura.</p></section>
{destacado}
<div class="ad" data-slot="medio"></div>
<div class="grid">{''.join(cards)}</div></main>{side(root)}</div>""" + foot(root)
open(os.path.join(OUT, "index.html"), "w").write(index)
print("ok")
