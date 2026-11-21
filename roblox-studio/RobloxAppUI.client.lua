--[[
  Recreación de la UI móvil de Roblox (Home) dentro de un juego de Roblox.
  USO: en Roblox Studio crea un LocalScript dentro de StarterPlayer > StarterPlayerScripts,
  pega TODO este archivo y dale Play. Crea toda la interfaz por código (no necesita nada más).
  Los iconos son figuras dibujadas; si quieres los iconos reales, sube tus PNG a Roblox,
  y pon sus ids en la tabla ICONS de abajo ("rbxassetid://123456").
  Esto es solo interfaz: no maneja Robux ni dinero de verdad.
]]

local Players = game:GetService("Players")
local AvatarEditorService = game:GetService("AvatarEditorService")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
-- oculta la barra de arriba de Roblox (menu, chat, etc.) para que la UI ocupe toda la pantalla
pcall(function() game:GetService("StarterGui"):SetCore("TopbarEnabled", false) end)
pcall(function() game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.All, false) end)

-- ICONOS OPCIONALES (deja "" para usar la figura dibujada)
-- Sube los PNG de la carpeta "assets" (Creator Hub > Assets > Images) y pega aquí los ids, p. ej. "rbxassetid://1234567890"
local ICONS = { search = "", robux = "", bell = "", home = "", home_filled = "", moments = "", chat = "", me = "", menu = "", addfriend = "" }

-- Imagen opcional del fondo del avatar: sube assets/avatar-scene.png y pega su id (ej. "rbxassetid://123")
local ASSETS = { scene = "" }
-- Iconos del panel lateral (assets/drawer_*.png). Deja "" para usar un cuadro de relleno
local DICONS = { favorites = "", continue = "", friends = "", communities = "", inventory = "", trades = "", messages = "", plus = "", settings = "", help = "", moments = "", learn = "", create = "" }

local C = {
	bg = Color3.fromRGB(255, 255, 255),
	text = Color3.fromRGB(30, 30, 32),
	sub = Color3.fromRGB(92, 96, 108),
	line = Color3.fromRGB(232, 233, 236),
	gray = Color3.fromRGB(237, 238, 240),
	blue = Color3.fromRGB(51, 95, 255),
	tile = Color3.fromRGB(205, 208, 215),
}
local FONT, FONT_B, FONT_LOGO = Enum.Font.BuilderSans, Enum.Font.BuilderSansBold, Enum.Font.GothamBlack

local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props or {}) do o[k] = v end
	if parent then o.Parent = parent end
	return o
end
local function corner(o, r) return new("UICorner", { CornerRadius = r or UDim.new(1, 0) }, o) end
local function label(parent, text, size, bold, color, pos, sz, align)
	return new("TextLabel", {
		BackgroundTransparency = 1, Text = text, TextSize = size, Font = bold and FONT_B or FONT,
		TextColor3 = color or C.text, Position = pos, Size = sz or UDim2.new(1, 0, 0, size + 4),
		TextXAlignment = align or Enum.TextXAlignment.Left,
	}, parent)
end
local function icon(parent, key, pos, size, draw)
	local holder = new("Frame", { BackgroundTransparency = 1, Position = pos, Size = size }, parent)
	if (ICONS[key] or "") ~= "" then
		new("ImageLabel", { Name = "Img", BackgroundTransparency = 1, Image = ICONS[key], ImageColor3 = C.text, Size = UDim2.fromScale(1, 1) }, holder)
	elseif draw then
		draw(holder)
	end
	return holder
end

-- Caracteres Unicode OFICIALES de Roblox (funcionan en cualquier TextLabel)
local GLYPH = { robux = utf8.char(0xE002), premium = utf8.char(0xE001), verified = utf8.char(0xE000), plus = utf8.char(0xE003) }
local function glyph(parent, code, px, pos, color)
	return new("TextLabel", { BackgroundTransparency = 1, Text = GLYPH[code], TextSize = px, Font = Enum.Font.BuilderSans, TextColor3 = color or C.text, Position = pos, Size = UDim2.fromOffset(px + 4, px + 4), TextXAlignment = Enum.TextXAlignment.Center, TextYAlignment = Enum.TextYAlignment.Center }, parent)
end
local function hexIcon(parent, px, pos, color)
	return glyph(parent, "robux", px, pos, color)
end
-- X dibujada (el caracter de la X no existe en la fuente y sale como un cuadrito)
local function xMark(btn, color, len)
	btn.Text = ""
	len = len or 16
	for _, r in ipairs({ 45, -45 }) do
		new("Frame", { BackgroundColor3 = color or C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(len, 2), Rotation = r, ZIndex = btn.ZIndex + 1 }, btn)
	end
end

-- saldo de JUGUETE (solo simulacion, no es Robux real)
local simBalance = 1000
local profile = { name = player.DisplayName, plus = false, verified = false }
local nameLabels = {}
local balanceLabels = {}
local openSendSheet
local openRobuxPage

-- ======== ScreenGui ========
-- fondo blanco detras de la barra de Roblox; la interfaz empieza DEBAJO de esa barra (deja el espacio libre)
local bgGui = new("ScreenGui", { Name = "RobloxAppBG", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = -5 }, player:WaitForChild("PlayerGui"))
new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0 }, bgGui)
local gui = new("ScreenGui", { Name = "RobloxAppUI", ResetOnSpawn = false, IgnoreGuiInset = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling }, player:WaitForChild("PlayerGui"))
local root = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0 }, gui)

-- ======== Cabecera ========
local header = new("Frame", { Size = UDim2.new(1, 0, 0, 56), BackgroundTransparency = 1 }, root)
-- menú (3 rayas + punto azul)
icon(header, "menu", UDim2.new(0, 16, 0, 16), UDim2.fromOffset(26, 24), function(h)
	for i = 0, 2 do new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.new(0, 0, 0, i * 10), Size = UDim2.new(1, 0, 0, 2) }, h) end
	local dot = new("Frame", { BackgroundColor3 = C.blue, BorderSizePixel = 0, Position = UDim2.new(1, -6, 0, -8), Size = UDim2.fromOffset(9, 9) }, h)
	corner(dot)
end)
label(header, "ROBLOX", 22, true, C.text, UDim2.fromOffset(56, 12), UDim2.fromOffset(140, 30)).Font = FONT_LOGO
-- derecha: buscar, robux (hexágono), campana
icon(header, "search", UDim2.new(1, -118, 0, 15), UDim2.fromOffset(26, 26), function(h)
	local c = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(20, 20) }, h)
	corner(c); new("UIStroke", { Color = C.text, Thickness = 2.2 }, c)
	local handle = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(21, 21), Size = UDim2.fromOffset(8, 2.5), Rotation = 45 }, h)
end)
icon(header, "robux", UDim2.new(1, -80, 0, 15), UDim2.fromOffset(26, 26), function(h)
	glyph(h, "robux", 24, UDim2.fromOffset(-1, -1), C.text)
end)
icon(header, "bell", UDim2.new(1, -42, 0, 15), UDim2.fromOffset(26, 26), function(h)
	local b = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(3, 2), Size = UDim2.fromOffset(20, 20) }, h)
	new("UICorner", { CornerRadius = UDim.new(0.5, 0) }, b); new("UIStroke", { Color = C.text, Thickness = 2 }, b)
	local clap = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.fromOffset(10, 22), Size = UDim2.fromOffset(6, 3) }, h)
	corner(clap)
end)

-- ======== Pestañas For you / Charts ========
local tabsBar = new("Frame", { Position = UDim2.fromOffset(0, 56), Size = UDim2.new(1, 0, 0, 44), BackgroundTransparency = 1 }, root)
new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Position = UDim2.new(0, 16, 1, -1), Size = UDim2.new(1, -32, 0, 1) }, tabsBar)
local underline = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.new(0, 16, 1, -2), Size = UDim2.new(0.5, -16, 0, 2) }, tabsBar)
local tabButtons, pages = {}, {}
local currentTab, currentNav = "For you", "Home"
local function showPages()
	for n, pg in pairs(pages) do
		pg.Visible = (currentNav == "Home" and n == currentTab)
	end
end
local function selectTab(name)
	currentTab = name
	for n, b in pairs(tabButtons) do b.TextColor3 = (n == name) and C.text or C.sub end
	showPages()
	local x = (name == "For you") and 0 or 0.5
	TweenService:Create(underline, TweenInfo.new(0.2, Enum.EasingStyle.Quad), { Position = UDim2.new(x, x == 0 and 16 or 0, 1, -2) }):Play()
end
for i, name in ipairs({ "For you", "Charts" }) do
	local b = new("TextButton", { Text = name, TextSize = 18, Font = FONT, TextColor3 = C.sub, BackgroundTransparency = 1, Position = UDim2.new((i - 1) * 0.5, 0, 0, 0), Size = UDim2.new(0.5, 0, 1, -2), AutoButtonColor = false }, tabsBar)
	tabButtons[name] = b
	b.Activated:Connect(function() selectTab(name) end)
end

-- ======== Contenido ========
local content = new("Frame", { Position = UDim2.fromOffset(0, 100), Size = UDim2.new(1, 0, 1, -100 - 64), BackgroundTransparency = 1, ClipsDescendants = true }, root)

local function page(name)
	local s = new("ScrollingFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Visible = false }, content)
	new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16), PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 24) }, s)
	new("UIListLayout", { Padding = UDim.new(0, 18), SortOrder = Enum.SortOrder.LayoutOrder }, s)
	pages[name] = s
	return s
end

local function section(parent, title, order)
	local f = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = order }, parent)
	new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }, f)
	label(f, title, 22, true, C.text, nil, UDim2.new(1, 0, 0, 28)).LayoutOrder = 0
	return f
end
-- ======== Juegos (lista de ejemplo con iconos reales de Roblox) ========
local GAMES = {
	{ name = "Adopt Me!", place = 920587237, rating = 88, players = 148, desc = "Raise pets, decorate your home and trade with friends." },
	{ name = "Brookhaven RP", place = 4924922222, rating = 85, players = 612, desc = "Roleplay in a town: houses, cars and jobs." },
	{ name = "Blox Fruits", place = 2753915549, rating = 91, players = 389, desc = "Sail the seas, fight bosses and unlock powerful fruits." },
	{ name = "Murder Mystery 2", place = 142823291, rating = 86, players = 74, desc = "Survive as an innocent, find the sheriff, avoid the murderer." },
	{ name = "Tower of Hell", place = 1962086868, rating = 84, players = 41, desc = "Climb a randomly generated tower with no checkpoints." },
	{ name = "Arsenal", place = 286090429, rating = 87, players = 33, desc = "Fast arcade shooter: every kill gives you a new weapon." },
	{ name = "Jailbreak", place = 606849621, rating = 83, players = 52, desc = "Cops and robbers open world: escape, rob and chase." },
	{ name = "DOORS", place = 6516141723, rating = 94, players = 190, desc = "Explore a mysterious hotel and survive what hides behind each door." },
	{ name = "Natural Disaster Survival", place = 189707, rating = 89, players = 27, desc = "Survive tornadoes, earthquakes and more on a random map." },
	{ name = "Pet Simulator 99", place = 8737899170, rating = 94, players = 255, desc = "Collect pets, break chests and explore new worlds." },
	{ name = "BedWars", place = 6872265039, rating = 82, players = 95, desc = "Protect your bed and destroy the others." },
	{ name = "Grow a Garden", place = 126884695634066, rating = 92, players = 410, desc = "Plant seeds, grow your garden and sell your harvest." },
	{ name = "Steal a Brainrot", place = 109983668079237, rating = 90, players = 520, desc = "Collect brainrots, build your base and steal from others." },
	{ name = "Dress To Impress", place = 15101393044, rating = 87, players = 310, desc = "Dress up to the theme and compete on the runway." },
	{ name = "Blade Ball", place = 13772394625, rating = 88, players = 120, desc = "Deflect the ball and be the last player standing." },
	{ name = "Royale High", place = 735030788, rating = 86, players = 64, desc = "Go to school, dress up and explore a fantasy world." },
	{ name = "Welcome to Bloxburg", place = 185655149, rating = 83, players = 78, desc = "Build your dream house, get a job and live your life." },
	{ name = "Work at a Pizza Place", place = 192800, rating = 85, players = 29, desc = "Cook, deliver and serve pizza with your friends." },
	{ name = "Piggy", place = 4623386862, rating = 84, players = 36, desc = "Escape the infected before they catch you." },
	{ name = "Phantom Forces", place = 292439477, rating = 90, players = 22, desc = "Tactical first-person shooter with realistic weapons." },
	{ name = "Bee Swarm Simulator", place = 1537690962, rating = 87, players = 45, desc = "Collect pollen, raise bees and fight bosses." },
	{ name = "Mad City", place = 1224212277, rating = 82, players = 31, desc = "Heroes and villains fight for control of the city." },
	{ name = "Theme Park Tycoon 2", place = 69184822, rating = 86, players = 19, desc = "Design and run your own amusement park." },
	{ name = "Lumber Tycoon 2", place = 13822889, rating = 84, players = 17, desc = "Chop trees, sell wood and build your base." },
	{ name = "Fisch", place = 16732694052, rating = 91, players = 160, desc = "Cast your line, catch rare fish and upgrade your gear." },
	{ name = "Rivals", place = 17625359962, rating = 90, players = 140, desc = "Fast 1v1 and team duels with unique weapons." },
	{ name = "Sol's RNG", place = 15532962292, rating = 89, players = 98, desc = "Roll for auras and unlock rare effects." },
}
local gameCursor = 0 -- cada fila toma juegos NUEVOS, sin repetir dentro de la fila ni con la fila de al lado
-- el icono real del juego se pide a Roblox (MarketplaceService); mientras carga se ve gris, sin el cuadrito de "imagen no disponible"
local MarketplaceService = game:GetService("MarketplaceService")
local function applyIcon(g, img)
	if g.icon then img.Image = g.icon; return end
	img.Image = ""
	task.spawn(function()
		if g.iconTried then
			while g.iconTried and not g.icon and not g.iconFailed do task.wait(0.3) end
		else
			g.iconTried = true
			local ok, info = pcall(function() return MarketplaceService:GetProductInfo(g.place) end)
			if ok and info and info.IconImageAssetId and info.IconImageAssetId ~= 0 then
				g.icon = "rbxassetid://" .. info.IconImageAssetId
				if info.Description and info.Description ~= "" and #info.Description < 400 then g.desc = info.Description end
			else
				g.iconFailed = true
			end
		end
		if g.icon and img.Parent then img.Image = g.icon end
	end)
end
local function fmtK(n) return n >= 1000 and string.format("%.1fM", n / 1000) or (n .. "K") end

local function openGameSheet(g)
	local EXT, H = 24, 380
	local gg = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 84 }, root)
	local dim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 84 }, gg)
	local sh = new("Frame", { BackgroundColor3 = Color3.fromRGB(248, 247, 247), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, H + EXT), Size = UDim2.new(1, 0, 0, H + EXT), ZIndex = 85, ClipsDescendants = true }, gg)
	corner(sh, UDim.new(0, 12))
	local function z(o) o.ZIndex = 86; return o end
	new("Frame", { BackgroundColor3 = Color3.fromRGB(214, 216, 222), BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 9), Size = UDim2.fromOffset(29, 3.3), ZIndex = 86 }, sh)
	local img = z(new("ImageLabel", { BackgroundColor3 = C.tile, Image = "", ScaleType = Enum.ScaleType.Crop, Position = UDim2.fromOffset(16, 28), Size = UDim2.new(1, -32, 0, 190) }, sh))
	corner(img, UDim.new(0, 12))
	applyIcon(g, img)
	z(label(sh, g.name, 22, true, C.text, UDim2.fromOffset(16, 230), UDim2.new(1, -32, 0, 30)))
	z(label(sh, g.rating .. "% Rating   \u{00B7}   " .. fmtK(g.players) .. " playing", 14, false, C.sub, UDim2.fromOffset(16, 262), UDim2.new(1, -32, 0, 20)))
	local d = z(label(sh, g.desc, 14, false, Color3.fromRGB(74, 77, 86), UDim2.fromOffset(16, 296), UDim2.new(1, -32, 0, 70)))
	d.TextWrapped = true; d.TextYAlignment = Enum.TextYAlignment.Top
	TweenService:Create(dim, TweenInfo.new(0.25), { BackgroundTransparency = 0.38 }):Play()
	TweenService:Create(sh, TweenInfo.new(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, EXT) }):Play()
	local closing = false
	local function close()
		if closing then return end
		closing = true
		TweenService:Create(dim, TweenInfo.new(0.23), { BackgroundTransparency = 1 }):Play()
		local tw = TweenService:Create(sh, TweenInfo.new(0.23, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 1, H + EXT) })
		tw:Play()
		tw.Completed:Once(function() gg:Destroy() end)
	end
	dim.Activated:Connect(close)
end

local chartLabels = {}
local function tilesRow(parent, count, w, h, order, reg)
	local row = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Size = UDim2.new(1, 0, 0, h + 44), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X, LayoutOrder = order }, parent)
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, row)
	for i = 1, count do
		local game_ = GAMES[(gameCursor % #GAMES) + 1]
		gameCursor += 1
		local t = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(w, h + 40) }, row)
		local img = new("ImageLabel", { BackgroundColor3 = C.tile, BorderSizePixel = 0, Image = "", ScaleType = Enum.ScaleType.Crop, Size = UDim2.fromOffset(w, h) }, t)
		corner(img, UDim.new(0, 10))
		applyIcon(game_, img)
		local nm = label(t, game_.name, 15, true, C.text, UDim2.fromOffset(0, h + 4), UDim2.new(1, 0, 0, 20))
		nm.TextTruncate = Enum.TextTruncate.AtEnd
		local pl = label(t, game_.rating .. "% Rating", 13, false, C.sub, UDim2.fromOffset(0, h + 22), UDim2.new(1, 0, 0, 16))
		if reg then chartLabels[#chartLabels + 1] = pl end
		local btn = new("TextButton", { Text = "", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 3 }, t)
		btn.Activated:Connect(function() openGameSheet(game_) end)
	end
	return row
end

-- ---- For you ----
local forYou = page("For you")
-- usuario
local userRow = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 56), LayoutOrder = 1 }, forYou)
local av = new("ImageLabel", { BackgroundColor3 = C.gray, Size = UDim2.fromOffset(52, 52), Image = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150" }, userRow); corner(av)
new("UIStroke", { Color = C.line, Thickness = 1 }, av)
nameLabels[#nameLabels + 1] = label(userRow, profile.name, 26, true, C.text, UDim2.fromOffset(66, 10), UDim2.new(1, -66, 0, 34))
-- amigos
local friends = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 150), LayoutOrder = 2 }, forYou)
local add = new("TextButton", { Text = "", AutoButtonColor = true, BackgroundColor3 = C.gray, Size = UDim2.fromOffset(88, 88) }, friends); corner(add)
local plus = label(add, "+", 34, false, C.text, UDim2.fromOffset(2, 2), UDim2.fromScale(1, 1), Enum.TextXAlignment.Center)
label(friends, "Add Friends", 16, true, C.text, UDim2.fromOffset(-8, 98), UDim2.fromOffset(104, 22), Enum.TextXAlignment.Center)
local hint = label(friends, "", 17, false, C.sub, UDim2.fromOffset(120, 22), UDim2.new(1, -124, 0, 48))
hint.Text = "Let's play! Start by adding a friend."
hint.TextWrapped = true
hint.TextYAlignment = Enum.TextYAlignment.Top

local rec = section(forYou, "Recommended For You", 3)
tilesRow(rec, 6, 150, 150, 1)
local cont = section(forYou, "Continue  ›", 4)
tilesRow(cont, 5, 150, 100, 1)

-- ======== Hoja de filtros de Charts (Device / Location), como en la app ========
local DEVICES = { { "All Devices", "all" }, { "Entry-level Phone", "low_end_phone" }, { "Standard Phone", "phone", "My device" }, { "Entry-level Tablet", "low_end_tablet" }, { "Standard Tablet", "tablet" }, { "Computer", "computer" }, { "Console", "console" }, { "VR", "vr" } }
local COUNTRIES = { { "Argentina", "ar" }, { "Australia", "au" }, { "Brazil", "br" }, { "Canada", "ca" }, { "Chile", "cl" }, { "Colombia", "co" }, { "France", "fr" }, { "Germany", "de" }, { "India", "in" }, { "Italy", "it" }, { "Japan", "jp" }, { "Mexico", "mx" }, { "Peru", "pe" }, { "Spain", "es" }, { "United Kingdom", "gb" }, { "United States", "us" } }
local myCountry = "us"
pcall(function()
	local c = game:GetService("LocalizationService"):GetCountryRegionForPlayerAsync(player)
	if c and #c == 2 then myCountry = c:lower() end
end)
local chartDevice, chartLoc = "phone", myCountry
local function nameOf(list, id)
	for _, it in ipairs(list) do if it[2] == id then return it[1] end end
	return id == "all" and "All Locations" or id:upper()
end
local function locOptions()
	local o = { { "All Locations", "all" } }
	for _, c in ipairs(COUNTRIES) do if c[2] == myCountry then o[#o + 1] = { c[1], c[2], "My location" } end end
	for _, c in ipairs(COUNTRIES) do if c[2] ~= myCountry then o[#o + 1] = c end end
	return o
end
local function openChartSheet(kind, current, onApply)
	local isLoc = (kind == "loc")
	local opts = isLoc and locOptions() or DEVICES
	-- medidas de la app: handle 9+3.3, titulo 20px, lista a 14px, filas de 30.3px, pie 12 + boton 32.5 + 24
	local ROW, EXT = 30.3, 24
	local screenH = root.AbsoluteSize.Y
	local H = math.min(screenH - 90, 12.3 + 20 + 30 + 14 + #opts * ROW + 68.5)
	local g = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 85 }, root)
	local dim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 85 }, g)
	local sh = new("Frame", { BackgroundColor3 = Color3.fromRGB(248, 247, 247), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, H + EXT), Size = UDim2.new(1, 0, 0, H + EXT), ZIndex = 86, ClipsDescendants = true }, g)
	corner(sh, UDim.new(0, 12))
	new("Frame", { BackgroundColor3 = Color3.fromRGB(214, 216, 222), BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 9), Size = UDim2.fromOffset(29, 3.3), ZIndex = 87 }, sh)
	label(sh, isLoc and "Location" or "Device", 20, true, Color3.fromRGB(32, 34, 39), UDim2.fromOffset(20, 32.3), UDim2.fromOffset(200, 30)).ZIndex = 87
	local x = new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.new(1, -51, 0, 32.3), Size = UDim2.fromOffset(30, 30), ZIndex = 87 }, sh)
	xMark(x, Color3.fromRGB(32, 34, 39), 13)
	local listH = H - 76.3 - 68.5
	local list = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 76.3), Size = UDim2.new(1, 0, 0, listH), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 87 }, sh)
	new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder }, list)
	new("UIPadding", { PaddingLeft = UDim.new(0, 20), PaddingRight = UDim.new(0, 20) }, list)
	local picked = current
	local apply
	local radios = {}
	local nameLbls = {}
	local function refresh()
		for id, r in pairs(radios) do
			local on = (id == picked)
			r.outer.BackgroundColor3 = on and Color3.fromRGB(32, 34, 39) or Color3.fromRGB(58, 61, 70)
			r.inner.Size = on and UDim2.fromOffset(8, 8) or UDim2.fromOffset(15.8, 15.8)
			r.inner.BackgroundColor3 = on and Color3.new(1, 1, 1) or Color3.fromRGB(248, 247, 247)
			nameLbls[id].TextColor3 = on and Color3.fromRGB(32, 34, 39) or Color3.fromRGB(74, 77, 86)
			nameLbls[id].Font = on and FONT_B or Enum.Font.BuilderSansMedium
		end
		apply.BackgroundTransparency = (picked ~= current) and 0 or 0.5
	end
	apply = new("TextButton", { Text = "Apply", TextSize = 14.7, Font = Enum.Font.BuilderSansMedium, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = Color3.fromRGB(51, 95, 255), AutoButtonColor = false, Position = UDim2.fromOffset(19.5, H - 24 - 32.5), Size = UDim2.new(1, -39, 0, 32.5), ZIndex = 87 }, sh)
	corner(apply, UDim.new(0, 8))
	for i, o in ipairs(opts) do
		local row = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, ROW), LayoutOrder = i, ZIndex = 87 }, list)
		local outer = new("Frame", { BackgroundColor3 = Color3.fromRGB(58, 61, 70), BorderSizePixel = 0, Position = UDim2.fromOffset(0, (ROW - 19) / 2), Size = UDim2.fromOffset(19, 19), ZIndex = 87 }, row)
		corner(outer)
		local inner = new("Frame", { BackgroundColor3 = Color3.fromRGB(248, 247, 247), BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(15.8, 15.8), ZIndex = 88 }, outer)
		corner(inner)
		radios[o[2]] = { outer = outer, inner = inner }
		local nm = label(row, o[1], 14.7, false, Color3.fromRGB(74, 77, 86), UDim2.fromOffset(29, 0), UDim2.new(1, -60, 1, 0))
		nm.ZIndex = 87
		nameLbls[o[2]] = nm
		if o[3] then
			local tagTxt = o[3]
			local tag = new("TextLabel", { BackgroundColor3 = Color3.fromRGB(227, 228, 232), Text = tagTxt, TextSize = 12.6, Font = Enum.Font.BuilderSansMedium, TextColor3 = Color3.fromRGB(32, 34, 39), AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 20), ZIndex = 88 }, row)
			corner(tag)
			new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10) }, tag)
			if isLoc then
				tag.AnchorPoint = Vector2.new(1, 0.5); tag.Position = UDim2.new(1, -28, 0.5, 0)
			else
				-- junto al nombre (10px despues del texto)
				tag.Position = UDim2.fromOffset(29 + (#o[1] * 7.6) + 10, (ROW - 20) / 2)
			end
		end
		row.Activated:Connect(function() picked = o[2]; refresh() end)
	end
	refresh()
	-- animaciones de la app: scrim .25s, hoja sube .3s (cubic .2,.8,.2,1); al cerrar baja .23s ease-in
	TweenService:Create(dim, TweenInfo.new(0.25), { BackgroundTransparency = 0.38 }):Play()
	TweenService:Create(sh, TweenInfo.new(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, EXT) }):Play()
	local closing = false
	local function close()
		if closing then return end
		closing = true
		TweenService:Create(dim, TweenInfo.new(0.23), { BackgroundTransparency = 1 }):Play()
		local tw = TweenService:Create(sh, TweenInfo.new(0.23, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 1, H + EXT) })
		tw:Play()
		tw.Completed:Once(function() g:Destroy() end)
	end
	dim.Activated:Connect(close)
	x.Activated:Connect(close)
	apply.Activated:Connect(function()
		if picked == current then return end
		onApply(picked)
		close()
	end)
end

-- ---- Charts ----
local charts = page("Charts")
-- filtros: dispositivo y pais (pildoras oscuras)
local filters = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 36), LayoutOrder = 1 }, charts)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, filters)
local pillDev, pillLoc
local function chartSeed()
	local h = 0
	for c in (chartDevice .. chartLoc):gmatch(".") do h = (h * 31 + c:byte()) % 9973 end
	return h
end
local function refreshCharts()
	pillDev.Text = nameOf(DEVICES, chartDevice) .. "  \u{2304}"
	pillLoc.Text = nameOf(COUNTRIES, chartLoc) .. "  \u{2304}"
	local seed = chartSeed()
	for i, l in ipairs(chartLabels) do
		l.Text = ((seed * (i + 7)) % 940 + 12) .. "K playing"
	end
end
local function makePill(txt, onTap)
	local b = new("TextButton", { Text = txt, TextSize = 16, Font = FONT, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = Color3.fromRGB(24, 25, 29), AutoButtonColor = true, AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 32) }, filters)
	corner(b)
	new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14) }, b)
	b.Activated:Connect(onTap)
	return b
end
pillDev = makePill("", function() openChartSheet("dev", chartDevice, function(v) chartDevice = v; refreshCharts() end) end)
pillLoc = makePill("", function() openChartSheet("loc", chartLoc, function(v) chartLoc = v; refreshCharts() end) end)
local function chartSection(title, subtitle, order)
	local f = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = order }, charts)
	new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, f)
	local head = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, subtitle and 50 or 32), LayoutOrder = 0 }, f)
	label(head, title .. "  \u{203A}", 24, true, C.text, UDim2.fromOffset(0, 0), UDim2.new(1, -40, 0, 30))
	if subtitle then label(head, subtitle, 15, false, C.sub, UDim2.fromOffset(0, 28), UDim2.new(1, -40, 0, 20)) end
	local info = new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 4), Size = UDim2.fromOffset(20, 20) }, head)
	corner(info); new("UIStroke", { Color = C.text, Thickness = 1.6 }, info)
	label(info, "i", 13, true, C.text, nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center)
	tilesRow(f, 6, 150, 150, 1, true)
	return f
end
chartSection("Top Trending", nil, 2)
chartSection("Up-and-Coming", nil, 3)
chartSection("Top Playing Now", "Results for all devices and locations", 4)
chartSection("Fun with Friends", nil, 5)
chartSection("Top Revisited", nil, 6)
refreshCharts()

-- ---- Me: pantalla Avatar (3D real + catalogo real) ----
local avScreen = new("Frame", { Name = "AvatarScreen", Size = UDim2.new(1, 0, 1, -64), BackgroundColor3 = Color3.fromRGB(216, 217, 226), BorderSizePixel = 0, Visible = false, ClipsDescendants = true }, root)
if ASSETS.scene ~= "" then
	new("ImageLabel", { BackgroundTransparency = 1, Image = ASSETS.scene, ScaleType = Enum.ScaleType.Crop, Size = UDim2.new(1, 0, 0, 360) }, avScreen)
end
-- 3D: tu personaje real
local vp = new("ViewportFrame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 360), Ambient = Color3.fromRGB(190, 190, 190), LightColor = Color3.fromRGB(255, 255, 255) }, avScreen)
local world = new("WorldModel", {}, vp)
local cam = new("Camera", { FieldOfView = 40 }, vp)
vp.CurrentCamera = cam
local rig, yaw, desc = nil, 0, nil
local function placeCamera()
	if not rig then return end
	local rootPart = rig:FindFirstChild("HumanoidRootPart")
	if not rootPart then return end
	local pos = rootPart.Position + Vector3.new(0, 0.5, 0)
	local dir = CFrame.Angles(0, math.rad(yaw), 0) * Vector3.new(0, 0, 9)
	cam.CFrame = CFrame.lookAt(pos + dir, pos)
end
local function buildRig()
	if not desc then return end
	local ok, model = pcall(function() return Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R15) end)
	if not ok or not model then return end
	if rig then rig:Destroy() end
	rig = model
	rig:PivotTo(CFrame.new(0, 3, 0))
	rig.Parent = world
	placeCamera()
end
local history, hIndex = {}, 0
local function loadMyDescription()
	task.spawn(function()
		local ok, d = pcall(function() return Players:GetHumanoidDescriptionFromUserId(player.UserId) end)
		if ok and d then desc = d; history = { d:Clone() }; hIndex = 1; buildRig() end
	end)
end
loadMyDescription()
-- girar arrastrando
local dragging, lastX = false, 0
vp.InputBegan:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = true; lastX = i.Position.X end
end)
vp.InputEnded:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = false end
end)
vp.InputChanged:Connect(function(i)
	if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
		yaw = yaw - (i.Position.X - lastX) * 0.8
		lastX = i.Position.X
		placeCamera()
	end
end)

local WHITE_PILL = Color3.fromRGB(255, 255, 255)
local openDrawerFromAvatar -- se define mas abajo con el panel lateral
local setMode -- Marketplace / Customize

-- HUD: menu, Marketplace/Customize, buscar
local avMenu = icon(avScreen, "menu", UDim2.fromOffset(20, 17), UDim2.fromOffset(26, 24), function(h)
	for i = 0, 2 do new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.new(0, 0, 0, i * 10), Size = UDim2.new(1, 0, 0, 2) }, h) end
	local dot = new("Frame", { BackgroundColor3 = C.blue, BorderSizePixel = 0, Position = UDim2.new(1, -6, 0, -8), Size = UDim2.fromOffset(9, 9) }, h)
	corner(dot)
end)
local avMenuBtn = new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.fromOffset(8, 6), Size = UDim2.fromOffset(52, 44), ZIndex = 5 }, avScreen)
avMenuBtn.Activated:Connect(function() if openDrawerFromAvatar then openDrawerFromAvatar() end end)

local seg = new("Frame", { BackgroundColor3 = WHITE_PILL, BackgroundTransparency = 0.15, Position = UDim2.new(0.5, -75, 0, 10), Size = UDim2.fromOffset(150, 34), BorderSizePixel = 0 }, avScreen)
corner(seg)
local segSel = new("Frame", { BackgroundColor3 = Color3.fromRGB(214, 215, 222), BorderSizePixel = 0, Position = UDim2.fromOffset(4, 3), Size = UDim2.fromOffset(76, 28) }, seg)
corner(segSel)
local segBtns = {}
for i, nm in ipairs({ "Marketplace", "Customize" }) do
	local b = new("TextButton", { Text = nm, TextSize = 13, Font = FONT, TextColor3 = C.text, BackgroundTransparency = 1, Position = UDim2.new((i - 1) * 0.5, 0, 0, 0), Size = UDim2.new(0.5, 0, 1, 0), AutoButtonColor = false }, seg)
	segBtns[i] = b
	b.Activated:Connect(function()
		TweenService:Create(segSel, TweenInfo.new(0.18, Enum.EasingStyle.Quad), { Position = UDim2.fromOffset(i == 1 and 4 or 70, 3), Size = UDim2.fromOffset(76, 28) }):Play()
		if setMode then setMode(i) end
	end)
end
icon(avScreen, "search", UDim2.new(1, -52, 0, 14), UDim2.fromOffset(26, 26), function(h)
	local c = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(20, 20) }, h)
	corner(c); new("UIStroke", { Color = C.text, Thickness = 2.2 }, c)
	new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(21, 21), Size = UDim2.fromOffset(8, 2.5), Rotation = 45 }, h)
end)

-- widget izquierdo: avatar + ajustes
local leftW = new("Frame", { BackgroundColor3 = WHITE_PILL, Position = UDim2.fromOffset(20, 53), Size = UDim2.fromOffset(40, 80), BorderSizePixel = 0 }, avScreen)
corner(leftW)
local thumb = new("ImageLabel", { BackgroundColor3 = C.gray, Position = UDim2.fromOffset(2, 2), Size = UDim2.fromOffset(36, 36), Image = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150" }, leftW)
corner(thumb)
label(leftW, "\u{2699}", 20, false, C.text, UDim2.fromOffset(0, 44), UDim2.fromOffset(40, 30), Enum.TextXAlignment.Center)
-- saldo (de juguete): abre Send
local chip = new("Frame", { BackgroundColor3 = WHITE_PILL, Position = UDim2.new(1, -82, 0, 53), Size = UDim2.fromOffset(64, 42), BorderSizePixel = 0 }, avScreen)
corner(chip)
hexIcon(chip, 22, UDim2.fromOffset(10, 10), C.text)
local chipLbl = label(chip, tostring(simBalance), 17, false, C.text, UDim2.fromOffset(36, 8), UDim2.fromOffset(26, 26))
balanceLabels[#balanceLabels + 1] = chipLbl
local chipBtn = new("TextButton", { Text = "", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 5 }, chip)
chipBtn.Activated:Connect(function() if openRobuxPage then openRobuxPage() end end)
-- deshacer / rehacer
local urPill = new("Frame", { BackgroundColor3 = WHITE_PILL, BackgroundTransparency = 0.2, Position = UDim2.fromOffset(20, 282), Size = UDim2.fromOffset(80, 40), BorderSizePixel = 0 }, avScreen)
corner(urPill)
local undoB = new("TextButton", { Text = "\u{21B6}", TextSize = 22, Font = FONT, TextColor3 = C.sub, BackgroundTransparency = 1, Size = UDim2.fromOffset(40, 40) }, urPill)
local redoB = new("TextButton", { Text = "\u{21B7}", TextSize = 22, Font = FONT, TextColor3 = C.sub, BackgroundTransparency = 1, Position = UDim2.fromOffset(40, 0), Size = UDim2.fromOffset(40, 40) }, urPill)
local function applyHistory()
	if history[hIndex] then desc = history[hIndex]:Clone(); buildRig() end
end
undoB.Activated:Connect(function() if hIndex > 1 then hIndex -= 1; applyHistory() end end)
redoB.Activated:Connect(function() if hIndex < #history then hIndex += 1; applyHistory() end end)

-- hoja inferior
local sheet = new("Frame", { BackgroundColor3 = C.bg, Position = UDim2.fromOffset(0, 335), Size = UDim2.new(1, 0, 1, -335), BorderSizePixel = 0 }, avScreen)
corner(sheet, UDim.new(0, 28))
new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Position = UDim2.new(0.5, -17, 0, 10), Size = UDim2.fromOffset(34, 4) }, sheet)
corner(sheet:FindFirstChildOfClass("Frame"), UDim.new(1, 0))

local CATS = {
	{ "All", Enum.AvatarAssetType.Hat, "Hat" },
	{ "Avatars", Enum.AvatarAssetType.FaceAccessory, "Face" },
	{ "Backgrounds", nil, nil },
	{ "Body", Enum.AvatarAssetType.HairAccessory, "Hair" },
	{ "Clothing", Enum.AvatarAssetType.Shirt, "Shirt" },
	{ "Accessories", Enum.AvatarAssetType.Hat, "Hat" },
	{ "Animations", nil, nil },
	{ "Makeup", nil, nil },
}
local tabsRow = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, -52, 0, 40), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X }, sheet)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 20) }, tabsRow)
new("UIPadding", { PaddingLeft = UDim.new(0, 10) }, tabsRow)
-- icono de filtros (3 rayas con puntos)
local filt = new("Frame", { BackgroundTransparency = 1, Position = UDim2.new(1, -44, 0, 30), Size = UDim2.fromOffset(24, 22) }, sheet)
for i = 0, 2 do
	new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.fromOffset(0, i * 9 + 2), Size = UDim2.new(1, 0, 0, 2) }, filt)
	local d = new("Frame", { BackgroundColor3 = C.bg, BorderSizePixel = 0, Position = UDim2.fromOffset(4 + ((i * 9) % 13), i * 9 - 1), Size = UDim2.fromOffset(7, 7) }, filt)
	corner(d); new("UIStroke", { Color = C.text, Thickness = 1.6 }, d)
end

local body = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 66), Size = UDim2.new(1, 0, 1, -66), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, sheet)
new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14), PaddingBottom = UDim.new(0, 20) }, body)
new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }, body)
local recTitle = label(body, "Recommended For You", 22, true, C.text, nil, UDim2.new(1, 0, 0, 30)); recTitle.LayoutOrder = 1
local function itemRow(order)
	local r = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 113), LayoutOrder = order }, body)
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, r)
	return r
end
local recRow = itemRow(2)
local exHead = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 36), LayoutOrder = 3 }, body)
label(exHead, "Explore Styles", 22, true, C.text, nil, UDim2.new(0.6, 0, 1, 0))
local seeAll = new("TextButton", { Text = "See All", TextSize = 14, Font = FONT_B, TextColor3 = C.text, BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, 0, 0.5, 0), Size = UDim2.fromOffset(74, 30) }, exHead)
corner(seeAll, UDim.new(0.5, 0)); new("UIStroke", { Color = C.text, Thickness = 1.5 }, seeAll)
local exRow = itemRow(4)
local status = label(body, "", 14, false, C.sub, nil, UDim2.new(1, 0, 0, 20)); status.LayoutOrder = 5

local function wear(assetId, kind)
	if not desc or not kind then return end
	if kind == "Shirt" then
		desc.Shirt = assetId
	elseif kind == "Pants" then
		desc.Pants = assetId
	elseif kind == "TShirt" then
		desc.GraphicTShirt = assetId
	else
		local names = { Hat = "Hat", Hair = "Hair", Face = "Face", Neck = "Neck", Shoulder = "Shoulder", Front = "Front", Back = "Back", Waist = "Waist", Jacket = "Jacket", LeftShoe = "LeftShoe" }
		local ok, t = pcall(function() return Enum.AccessoryType[names[kind] or "Hat"] end)
		if not ok or not t then return end
		local layered = (kind == "Jacket" or kind == "LeftShoe")
		local acc = desc:GetAccessories(true)
		table.insert(acc, { AssetId = assetId, AccessoryType = t, IsLayered = layered, Order = #acc + 1 })
		desc:SetAccessories(acc, true)
	end
	while #history > hIndex do table.remove(history) end
	table.insert(history, desc:Clone()); hIndex = #history
	buildRig()
end

-- ======== Marketplace: detalles, comprar (saldo de juguete), equipar / desequipar ========
local owned, equipped = {}, {}
local function setBalance(n)
	simBalance = n
	for _, l in ipairs(balanceLabels) do l.Text = tostring(n) end
end
local function toast(msg)
	local t = new("TextLabel", { BackgroundColor3 = Color3.fromRGB(32, 34, 39), Text = msg, TextSize = 15, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 20), Size = UDim2.fromOffset(170, 38), ZIndex = 130 }, root)
	corner(t)
	t.BackgroundTransparency = 1; t.TextTransparency = 1
	TweenService:Create(t, TweenInfo.new(0.2), { BackgroundTransparency = 0, TextTransparency = 0 }):Play()
	task.delay(2.4, function()
		TweenService:Create(t, TweenInfo.new(0.25), { BackgroundTransparency = 1, TextTransparency = 1 }):Play()
		task.delay(0.3, function() t:Destroy() end)
	end)
end
local function unwear(assetId, kind)
	if not desc then return end
	if kind == "Shirt" then desc.Shirt = 0
	elseif kind == "Pants" then desc.Pants = 0
	elseif kind == "TShirt" then desc.GraphicTShirt = 0
	else
		local keep = {}
		for _, a in ipairs(desc:GetAccessories(true)) do
			if a.AssetId ~= assetId then keep[#keep + 1] = a end
		end
		desc:SetAccessories(keep, true)
	end
	while #history > hIndex do table.remove(history) end
	table.insert(history, desc:Clone()); hIndex = #history
	buildRig()
end
local function openItemSheet(it, kind)
	local EXT, H = 24, 500
	local gi = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 100 }, root)
	local dim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 100 }, gi)
	local sh = new("Frame", { BackgroundColor3 = Color3.fromRGB(248, 247, 247), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, H + EXT), Size = UDim2.new(1, 0, 0, H + EXT), ZIndex = 101, ClipsDescendants = true }, gi)
	corner(sh, UDim.new(0, 12))
	local function z(o) o.ZIndex = 102; return o end
	new("Frame", { BackgroundColor3 = Color3.fromRGB(214, 216, 222), BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 9), Size = UDim2.fromOffset(29, 3.3), ZIndex = 102 }, sh)
	local img = z(new("ImageLabel", { BackgroundColor3 = C.gray, Image = "rbxthumb://type=Asset&id=" .. it.Id .. "&w=420&h=420", ScaleType = Enum.ScaleType.Fit, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 26), Size = UDim2.fromOffset(180, 180) }, sh))
	corner(img, UDim.new(0, 14))
	local title = z(label(sh, it.Name or "Item", 21, true, C.text, UDim2.fromOffset(18, 216), UDim2.new(1, -36, 0, 28)))
	title.TextTruncate = Enum.TextTruncate.AtEnd
	local by = z(label(sh, "", 14, false, C.sub, UDim2.fromOffset(18, 245), UDim2.new(1, -36, 0, 20)))
	local priceHex = glyph(sh, "robux", 20, UDim2.fromOffset(16, 272), C.text); priceHex.ZIndex = 102
	local price = z(label(sh, "...", 20, true, C.text, UDim2.fromOffset(42, 272), UDim2.new(1, -60, 0, 26)))
	local desc_ = z(label(sh, "", 14, false, Color3.fromRGB(74, 77, 86), UDim2.fromOffset(18, 308), UDim2.new(1, -36, 0, 70)))
	desc_.TextWrapped = true; desc_.TextYAlignment = Enum.TextYAlignment.Top; desc_.TextTruncate = Enum.TextTruncate.AtEnd
	local main = z(new("TextButton", { Text = "", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, AutoButtonColor = true, Position = UDim2.fromOffset(18, 396), Size = UDim2.new(1, -36, 0, 50) }, sh))
	corner(main, UDim.new(0, 12))
	local cost = tonumber(it.Price) or 0
	local function paint()
		price.Text = cost > 0 and tostring(cost) or "Free"
		priceHex.Visible = cost > 0
		price.Position = cost > 0 and UDim2.fromOffset(42, 272) or UDim2.fromOffset(18, 272)
		if not owned[it.Id] and cost > 0 then
			main.Text = (cost > simBalance) and "Not enough Robux" or ("Buy  " .. utf8.char(0xE002) .. " " .. cost)
			main.BackgroundColor3 = (cost > simBalance) and Color3.fromRGB(190, 200, 235) or C.blue
		else
			main.Text = equipped[it.Id] and "Unequip" or "Equip"
			main.BackgroundColor3 = equipped[it.Id] and Color3.fromRGB(226, 227, 232) or C.blue
			main.TextColor3 = equipped[it.Id] and C.text or Color3.new(1, 1, 1)
		end
	end
	paint()
	-- detalles reales (descripcion, creador, precio) desde Roblox
	task.spawn(function()
		local ok, info = pcall(function() return MarketplaceService:GetProductInfo(it.Id) end)
		if ok and info and gi.Parent then
			if info.Creator and info.Creator.Name then by.Text = "By " .. info.Creator.Name end
			if info.Description then desc_.Text = info.Description end
			if info.PriceInRobux and info.PriceInRobux > 0 then cost = info.PriceInRobux end
			paint()
		end
	end)
	main.Activated:Connect(function()
		if not owned[it.Id] and cost > 0 then
			if cost > simBalance then return end
			setBalance(simBalance - cost)
			owned[it.Id] = true
			toast("Purchased!")
		elseif not owned[it.Id] then
			owned[it.Id] = true
		end
		if equipped[it.Id] then
			equipped[it.Id] = nil; unwear(it.Id, kind)
		elseif owned[it.Id] and (main.Text == "Equip" or main.Text:find("Buy")) then
			equipped[it.Id] = true; wear(it.Id, kind)
		end
		paint()
	end)
	TweenService:Create(dim, TweenInfo.new(0.25), { BackgroundTransparency = 0.38 }):Play()
	TweenService:Create(sh, TweenInfo.new(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, EXT) }):Play()
	local closing = false
	dim.Activated:Connect(function()
		if closing then return end
		closing = true
		TweenService:Create(dim, TweenInfo.new(0.23), { BackgroundTransparency = 1 }):Play()
		local tw = TweenService:Create(sh, TweenInfo.new(0.23, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 1, H + EXT) })
		tw:Play()
		tw.Completed:Once(function() gi:Destroy() end)
	end)
end

local searchToken = 0
local function fillRow(row, items, from, to, cat)
	for i = from, to do
		local it = items[i]
		if not it then break end
		local cell = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, Size = UDim2.new(0.333, -7, 1, 0), LayoutOrder = i }, row)
		corner(cell, UDim.new(0, 12))
		new("ImageLabel", { BackgroundTransparency = 1, Image = "rbxthumb://type=Asset&id=" .. it.Id .. "&w=150&h=150", Size = UDim2.fromScale(1, 1), ScaleType = Enum.ScaleType.Fit }, cell)
		cell.Activated:Connect(function() openItemSheet(it, cat[3]) end)
	end
end
local function loadCategory(cat)
	searchToken += 1
	local my = searchToken
	for _, row in ipairs({ recRow, exRow }) do
		for _, c in ipairs(row:GetChildren()) do
			if c:IsA("GuiObject") then c:Destroy() end
		end
	end
	if not cat[2] then status.Text = "Nothing to show here yet."; return end
	status.Text = "Loading..."
	local ok, err = pcall(function()
		local params = CatalogSearchParams.new()
		params.AssetTypes = { cat[2] }
		params.SortType = Enum.CatalogSortType.MostFavorited
		params.IncludeOffSale = false
		local result = AvatarEditorService:SearchCatalog(params)
		local items = result:GetCurrentPage()
		if my ~= searchToken then return end
		status.Text = ""
		fillRow(recRow, items, 1, 3, cat)
		fillRow(exRow, items, 4, 6, cat)
	end)
	if not ok then
		status.Text = "Catalog unavailable (enable Studio access to API services in Game Settings > Security)."
		warn(err)
	end
end
local tabBtns = {}
local tabLine = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Size = UDim2.fromOffset(20, 3) }, sheet)
local function selectCat(i)
	for j, b in ipairs(tabBtns) do b.TextColor3 = (j == i) and C.text or C.sub; b.Font = (j == i) and FONT_B or FONT end
	loadCategory(CATS[i])
	task.defer(function()
		local bb = tabBtns[i]
		tabLine.Position = UDim2.fromOffset(bb.AbsolutePosition.X - sheet.AbsolutePosition.X, 61)
		tabLine.Size = UDim2.fromOffset(bb.AbsoluteSize.X, 3)
	end)
end
for i, cat in ipairs(CATS) do
	local b = new("TextButton", { Text = cat[1], TextSize = 19, Font = FONT, TextColor3 = C.sub, BackgroundTransparency = 1, AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 40), AutoButtonColor = false }, tabsRow)
	tabBtns[i] = b
	b.Activated:Connect(function() selectCat(i) end)
end
tabLine.Position = UDim2.fromOffset(10, 60)
tabLine.Size = UDim2.fromOffset(30, 3)
selectCat(1)
task.defer(function() loadCategory(CATS[1]) end)


-- ======== Customize ========
local czTabsRow = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, -52, 0, 40), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X, Visible = false }, sheet)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 20) }, czTabsRow)
new("UIPadding", { PaddingLeft = UDim.new(0, 10) }, czTabsRow)
local czLine = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Size = UDim2.fromOffset(30, 3), Position = UDim2.fromOffset(10, 61), Visible = false }, sheet)
local czBody = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 66), Size = UDim2.new(1, 0, 1, -66), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Visible = false }, sheet)
new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14), PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 20) }, czBody)
local czList = new("UIListLayout", { Padding = UDim.new(0, 12), SortOrder = Enum.SortOrder.LayoutOrder }, czBody)

local function commit()
	while #history > hIndex do table.remove(history) end
	table.insert(history, desc:Clone()); hIndex = #history
	buildRig()
end
local function czClear()
	for _, c in ipairs(czBody:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
end
local czOrder = 0
local function czAdd(inst) czOrder += 1; inst.LayoutOrder = czOrder; inst.Parent = czBody; return inst end
local function bigTile(text, onTap, content)
	local f = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(86, 112) })
	local t = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, Size = UDim2.fromOffset(86, 86) }, f)
	corner(t, UDim.new(0, 12))
	new("UIStroke", { Color = C.line, Thickness = 1.5 }, t)
	if content then content(t) end
	label(f, text, 14, false, C.text, UDim2.fromOffset(0, 90), UDim2.fromOffset(86, 20), Enum.TextXAlignment.Center)
	t.Activated:Connect(onTap)
	return f
end
local function tileRow()
	local r = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 114) })
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, r)
	return r
end
local function catalogInto(cat)
	local grid = czAdd(new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y }))
	new("UIGridLayout", { CellSize = UDim2.new(0.333, -7, 0, 113), CellPadding = UDim2.fromOffset(10, 10), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
	local st = label(grid, "Loading...", 14, false, C.sub, nil, UDim2.new(1, 0, 0, 20))
	task.spawn(function()
		local ok, err = pcall(function()
			local params = CatalogSearchParams.new()
			params.AssetTypes = { cat[2] }
			params.SortType = Enum.CatalogSortType.MostFavorited
			params.IncludeOffSale = false
			local items = AvatarEditorService:SearchCatalog(params):GetCurrentPage()
			if not grid.Parent then return end
			st:Destroy()
			for i, it in ipairs(items) do
				if i > 12 then break end
				local cell = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, LayoutOrder = i }, grid)
				corner(cell, UDim.new(0, 12))
				new("ImageLabel", { BackgroundTransparency = 1, Image = "rbxthumb://type=Asset&id=" .. it.Id .. "&w=150&h=150", Size = UDim2.fromScale(1, 1), ScaleType = Enum.ScaleType.Fit }, cell)
				cell.Activated:Connect(function() openItemSheet(it, cat[3]) end)
			end
		end)
		if not ok then warn(err); if st.Parent then st.Text = "Catalog unavailable." end end
	end)
end
-- ---- categorias de cada pestana de Customize (fila de iconos + lista debajo) ----
local function AT(name)
	local ok, v = pcall(function() return Enum.AvatarAssetType[name] end)
	return ok and v or nil
end
local CZICONS = { full_body = "", hair = "", head = "", build = "", skin = "", clear = "", top = "", outerwear = "", bottom = "", shoes = "", classic_shirt = "", classic_pants = "", classic_tshirt = "", head_accessory = "", face_accessory = "", neck = "", back = "", waist = "", shoulder = "", front = "", gear = "" }
-- { texto, icono, tipo de catalogo (nil = sin catalogo), clase para ponerlo }
local CZ_SUBS = {
	Body = { { "Full Body", "full_body" }, { "Hair", "hair", AT("HairAccessory"), "Hair" }, { "Head", "head" }, { "Build", "build" }, { "Skin", "skin" }, { "Clear", "clear" } },
	Clothing = { { "Top", "top", AT("Shirt"), "Shirt" }, { "Outerwear", "outerwear", AT("JacketAccessory"), "Jacket" }, { "Bottom", "bottom", AT("Pants"), "Pants" }, { "Shoes", "shoes", AT("LeftShoeAccessory"), "LeftShoe" }, { "Shirt Classic", "classic_shirt", AT("Shirt"), "Shirt" }, { "Pants Classic", "classic_pants", AT("Pants"), "Pants" }, { "T-Shirt Classic", "classic_tshirt", AT("TShirt"), "TShirt" }, { "Clear", "clear" } },
	Accessories = { { "Head", "head_accessory", AT("Hat"), "Hat" }, { "Face", "face_accessory", AT("FaceAccessory"), "Face" }, { "Neck", "neck", AT("NeckAccessory"), "Neck" }, { "Back", "back", AT("BackAccessory"), "Back" }, { "Waist", "waist", AT("WaistAccessory"), "Waist" }, { "Shoulder", "shoulder", AT("ShoulderAccessory"), "Shoulder" }, { "Front", "front", AT("FrontAccessory"), "Front" }, { "Gear", "gear" }, { "Clear", "clear" } },
}
local czSub = { Body = "Full Body", Clothing = "Top", Accessories = "Head" }
local czTab = "Avatars"
local buildCz
local function subTile(sub, selected, onTap)
	local f = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(78, 108) })
	local t = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, Size = UDim2.fromOffset(72, 72) }, f)
	corner(t, UDim.new(0, 12))
	new("UIStroke", { Color = selected and C.text or Color3.fromRGB(205, 207, 214), Thickness = selected and 2.5 or 1.5 }, t)
	local id = CZICONS[sub[2]] or ""
	if id ~= "" then
		new("ImageLabel", { BackgroundTransparency = 1, Image = id, ImageColor3 = C.sub, Position = UDim2.fromOffset(14, 14), Size = UDim2.fromOffset(44, 44) }, t)
	elseif sub[2] == "skin" then
		local d = new("Frame", { BackgroundColor3 = Color3.fromRGB(150, 103, 74), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(34, 34) }, t); corner(d)
	else
		label(t, "\u{25CB}", 30, false, C.sub, nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center)
	end
	if sub[2] ~= "skin" and sub[2] ~= "clear" then
		local plus = new("Frame", { BackgroundColor3 = C.gray, AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -4, 1, -4), Size = UDim2.fromOffset(22, 22) }, t)
		corner(plus); new("UIStroke", { Color = C.sub, Thickness = 1.4 }, plus)
		label(plus, "+", 17, false, C.sub, nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center)
	end
	label(f, sub[1], 14, false, C.text, UDim2.fromOffset(-3, 76), UDim2.fromOffset(84, 22), Enum.TextXAlignment.Center)
	t.Activated:Connect(onTap)
	return f
end
local SKINS = { Color3.fromRGB(255, 204, 153), Color3.fromRGB(234, 184, 146), Color3.fromRGB(205, 133, 63), Color3.fromRGB(150, 103, 74), Color3.fromRGB(98, 66, 47), Color3.fromRGB(245, 205, 160), Color3.fromRGB(160, 195, 230), Color3.fromRGB(120, 200, 140) }
local function setSkin(col)
	if not desc then return end
	desc.HeadColor = col; desc.TorsoColor = col; desc.LeftArmColor = col; desc.RightArmColor = col; desc.LeftLegColor = col; desc.RightLegColor = col
	commit()
end
local function subPanel(tab)
	local cur = czSub[tab]
	local subs = CZ_SUBS[tab]
	local sc = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Size = UDim2.new(1, 0, 0, 112), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X })
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }, sc)
	local chosen
	for _, sub in ipairs(subs) do
		if sub[1] == cur then chosen = sub end
		subTile(sub, sub[1] == cur, function()
			if sub[1] == "Clear" then loadMyDescription() else czSub[tab] = sub[1]; buildCz() end
		end).Parent = sc
	end
	czAdd(sc)
	chosen = chosen or subs[1]
	-- lista inferior
	if chosen[1] == "Skin" then
		local g = czAdd(new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 56) }))
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 12) }, g)
		for _, col in ipairs(SKINS) do
			local sw = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = col, Size = UDim2.fromOffset(40, 40) }, g)
			corner(sw); new("UIStroke", { Color = C.line, Thickness = 1.5 }, sw)
			sw.Activated:Connect(function() setSkin(col) end)
		end
	elseif chosen[1] == "Build" then
		local g = czAdd(new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 44) }))
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, g)
		for _, b in ipairs({ { "Slim", 0.9, 0.85 }, { "Normal", 1, 1 }, { "Tall", 1.05, 1 }, { "Wide", 1, 1.1 } }) do
			local btn = new("TextButton", { Text = b[1], TextSize = 16, Font = FONT_B, TextColor3 = C.text, BackgroundColor3 = C.gray, AutoButtonColor = true, Size = UDim2.fromOffset(78, 40) }, g)
			corner(btn)
			btn.Activated:Connect(function()
				if not desc then return end
				desc.HeightScale = b[2]; desc.WidthScale = b[3]; desc.DepthScale = b[3]
				commit()
			end)
		end
	elseif chosen[3] then
		catalogInto(chosen)
	else
		czAdd(label(czBody, "Loading...", 17, false, C.sub, nil, UDim2.new(1, 0, 0, 30), Enum.TextXAlignment.Center))
	end
end
buildCz = function()
	czClear(); czOrder = 0
	if czTab == "Avatars" then
		local r = tileRow()
		bigTile("Add/Edit", function() loadMyDescription() end, function(t) label(t, "+", 34, false, C.text, nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center) end).Parent = r
		czAdd(r)
	elseif CZ_SUBS[czTab] then
		subPanel(czTab)
	else
		czAdd(label(czBody, "Loading...", 17, false, C.sub, nil, UDim2.new(1, 0, 0, 30), Enum.TextXAlignment.Center))
	end
end
local CZ_TABS = { "Avatars", "Body", "Clothing", "Accessories", "Backgrounds", "Animations", "Emotes", "Makeup" }
local czBtns = {}
local function selectCz(name)
	czTab = name
	for _, b in ipairs(czBtns) do b.TextColor3 = (b.Text == name) and C.text or C.sub; b.Font = (b.Text == name) and FONT_B or FONT end
	buildCz()
	task.defer(function()
		for _, b in ipairs(czBtns) do
			if b.Text == name then
				czLine.Position = UDim2.fromOffset(b.AbsolutePosition.X - sheet.AbsolutePosition.X, 61)
				czLine.Size = UDim2.fromOffset(b.AbsoluteSize.X, 3)
			end
		end
	end)
end
for _, nm in ipairs(CZ_TABS) do
	local b = new("TextButton", { Text = nm, TextSize = 19, Font = FONT, TextColor3 = C.sub, BackgroundTransparency = 1, AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 40), AutoButtonColor = false }, czTabsRow)
	czBtns[#czBtns + 1] = b
	b.Activated:Connect(function() selectCz(nm) end)
end

setMode = function(i)
	local cz = (i == 2)
	tabsRow.Visible = not cz; tabLine.Visible = not cz; body.Visible = not cz
	czTabsRow.Visible = cz; czLine.Visible = cz; czBody.Visible = cz
	if cz then selectCz(czTab) end
end


-- ======== Send Robux (saldo de juguete, solo simulacion) ========
local sendGui = new("Frame", { Name = "SendRobux", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 80 }, root)
local sDim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 80 }, sendGui)
local sSheet = new("Frame", { BackgroundColor3 = Color3.fromRGB(247, 247, 249), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 24), Size = UDim2.new(1, 0, 0.86, 24), ZIndex = 81, ClipsDescendants = true }, sendGui)
corner(sSheet, UDim.new(0, 22))
local function z(o, n) o.ZIndex = n or 82; return o end
-- cabecera
local sHex = glyph(sSheet, "plus", 22, UDim2.fromOffset(15, 18), Color3.fromRGB(73, 77, 90))
local sTitle = z(label(sSheet, "Send Robux", 19, true, Color3.fromRGB(73, 77, 90), UDim2.fromOffset(45, 19), UDim2.fromOffset(200, 26)))
local sBalHex = hexIcon(sSheet, 16, UDim2.new(1, -104, 0, 23), Color3.fromRGB(32, 34, 39))
local sBal = z(label(sSheet, "", 15, false, Color3.fromRGB(32, 34, 39), UDim2.new(1, -84, 0, 19), UDim2.fromOffset(46, 22)))
balanceLabels[#balanceLabels + 1] = sBal
local sClose = z(new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.new(1, -44, 0, 16), Size = UDim2.fromOffset(32, 32) }, sSheet))
xMark(sClose, Color3.fromRGB(32, 34, 39), 13)

local sPages = {}
local function sPage(name, y)
	y = y or 64
	local f = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, y), Size = UDim2.new(1, 0, 1, -y), ZIndex = 82, Visible = false }, sSheet)
	sPages[name] = f
	return f
end
local function sShow(name)
	for n, f in pairs(sPages) do f.Visible = (n == name) end
end
local target, amount = nil, 0
local function avatarOf(id) return "rbxthumb://type=AvatarHeadShot&id=" .. id .. "&w=150&h=150" end
local function userRow(parent, u, y, onTap)
	local r = z(new("TextButton", { Text = "", AutoButtonColor = false, BackgroundTransparency = 1, Position = UDim2.fromOffset(0, y), Size = UDim2.new(1, 0, 0, 56) }, parent))
	local av = z(new("ImageLabel", { BackgroundColor3 = Color3.fromRGB(227, 228, 232), Image = avatarOf(u.Id), Position = UDim2.fromOffset(17, 8), Size = UDim2.fromOffset(39, 39) }, r))
	corner(av)
	z(label(r, u.DisplayName ~= "" and u.DisplayName or u.Username, 14.5, true, C.text, UDim2.fromOffset(66, 8), UDim2.new(1, -80, 0, 20)))
	z(label(r, "@" .. u.Username, 11.5, false, Color3.fromRGB(106, 111, 129), UDim2.fromOffset(66, 28), UDim2.new(1, -80, 0, 16)))
	if onTap then r.Activated:Connect(function() onTap(u) end) end
	return r
end

-- 1) buscar / amigos
local pSearch = sPage("search", 0)
local sField = z(new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(17, 54), Size = UDim2.new(1, -35, 0, 32) }, pSearch))
corner(sField); new("UIStroke", { Color = Color3.fromRGB(207, 209, 215), Thickness = 1 }, sField)
local sBox = z(new("TextBox", { BackgroundTransparency = 1, Text = "", PlaceholderText = "Search", PlaceholderColor3 = C.sub, TextSize = 15, Font = FONT, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(38, 0), Size = UDim2.new(1, -48, 1, 0) }, sField))
local sMag = z(new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(13, 8), Size = UDim2.fromOffset(16, 16) }, sField))
do
	local c = z(new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(14, 14) }, sMag)); corner(c); new("UIStroke", { Color = C.text, Thickness = 1.8 }, c)
	z(new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(15, 15), Size = UDim2.fromOffset(6, 2), Rotation = 45 }, sMag))
end
local sHead = z(label(pSearch, "My friends (0)", 15, true, C.text, UDim2.fromOffset(17, 98), UDim2.new(1, -35, 0, 22)))
local sList = z(new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 124), Size = UDim2.new(1, 0, 1, -124), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, pSearch))
local sEmpty = z(label(sList, "No friends yet", 13, false, Color3.fromRGB(107, 111, 120), UDim2.fromOffset(0, 20), UDim2.new(1, 0, 0, 20), Enum.TextXAlignment.Center))
local friendsCache = nil
local goAmount
local function showUsers(users, header)
	for _, c in ipairs(sList:GetChildren()) do
		if c:IsA("GuiObject") and c ~= sEmpty then c:Destroy() end
	end
	sHead.Text = header
	sEmpty.Visible = (#users == 0)
	for i, u in ipairs(users) do userRow(sList, u, (i - 1) * 56, function(x) goAmount(x) end) end
end
local function loadFriends()
	if friendsCache then showUsers(friendsCache, "My friends (" .. #friendsCache .. ")"); return end
	task.spawn(function()
		local users = {}
		local ok = pcall(function()
			local pages = Players:GetFriendsAsync(player.UserId)
			local page = pages:GetCurrentPage()
			for _, f in ipairs(page) do users[#users + 1] = { Id = f.Id, Username = f.Username, DisplayName = f.DisplayName or "" } end
		end)
		friendsCache = users
		showUsers(users, "My friends (" .. #users .. ")")
	end)
end
sBox.FocusLost:Connect(function(enter)
	local q = sBox.Text:gsub("^%s+", ""):gsub("%s+$", "")
	if q == "" then loadFriends(); return end
	sHead.Text = "Searching..."
	task.spawn(function()
		local ok, id = pcall(function() return Players:GetUserIdFromNameAsync(q) end)
		if ok and id then
			local ok2, nm = pcall(function() return Players:GetNameFromUserIdAsync(id) end)
			showUsers({ { Id = id, Username = ok2 and nm or q, DisplayName = "" } }, "People (1)")
		else
			-- sin conexion a la API: se deja continuar con el nombre escrito
			showUsers({ { Id = 1, Username = q, DisplayName = "" } }, "People (1)")
		end
	end)
end)

-- 2) monto (como en la app: avatar + nombre, monto, chips 25/50/100/200, Next, nota)
local pAmount = sPage("amount", 64)
local aAv = z(new("ImageLabel", { BackgroundColor3 = Color3.fromRGB(227, 228, 232), Position = UDim2.fromOffset(17, 4), Size = UDim2.fromOffset(44, 44) }, pAmount)); corner(aAv)
local aName = z(label(pAmount, "", 17, true, C.text, UDim2.fromOffset(70, 14), UDim2.new(1, -90, 0, 24)))
glyph(pAmount, "robux", 34, UDim2.fromOffset(20, 78), C.text)
local aBox = z(new("TextBox", { BackgroundTransparency = 1, Text = "", PlaceholderText = "0", PlaceholderColor3 = Color3.fromRGB(190, 192, 200), TextSize = 40, Font = FONT_B, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(64, 70), Size = UDim2.new(1, -90, 0, 52) }, pAmount))
local aChips = z(new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(17, 140), Size = UDim2.new(1, -34, 0, 38) }, pAmount))
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }, aChips)
for _, v in ipairs({ 25, 50, 100, 200 }) do
	local ch = z(new("TextButton", { Text = "", AutoButtonColor = true, BackgroundColor3 = Color3.fromRGB(231, 232, 236), Size = UDim2.fromOffset(74, 36) }, aChips))
	corner(ch)
	glyph(ch, "robux", 15, UDim2.fromOffset(10, 8), C.text)
	z(label(ch, tostring(v), 16, true, C.text, UDim2.fromOffset(32, 0), UDim2.fromOffset(40, 36)))
	ch.Activated:Connect(function() aBox.Text = tostring(v) end)
end
local aNext = z(new("TextButton", { Text = "Next", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, AutoButtonColor = true, Position = UDim2.fromOffset(17, 196), Size = UDim2.new(1, -34, 0, 50) }, pAmount))
corner(aNext, UDim.new(0, 12))
z(label(pAmount, "Robux are sent instantly with no fees", 13, false, C.sub, UDim2.fromOffset(0, 258), UDim2.new(1, 0, 0, 20), Enum.TextXAlignment.Center))
local function amountNow() return tonumber(aBox.Text) or 0 end
local function updateNext()
	local n = amountNow()
	if n > simBalance then
		aNext.Text = "Not enough Robux"; aNext.BackgroundColor3 = Color3.fromRGB(190, 200, 235)
	elseif n >= 1 then
		aNext.Text = "Next"; aNext.BackgroundColor3 = C.blue
	else
		aNext.Text = "Next"; aNext.BackgroundColor3 = Color3.fromRGB(190, 200, 235)
	end
end
aBox:GetPropertyChangedSignal("Text"):Connect(function()
	local t = aBox.Text:gsub("%D", ""):gsub("^0+", "")
	t = t:sub(1, 7)
	if t ~= aBox.Text then aBox.Text = t end
	updateNext()
end)

-- 3) revisar (avatar, nombre, @usuario, datos, monto, "The recipient will get...", Send / Edit, nota)
local pReview = sPage("review", 64)
local rvAv = z(new("ImageLabel", { BackgroundColor3 = Color3.fromRGB(227, 228, 232), AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 0), Size = UDim2.fromOffset(72, 72) }, pReview)); corner(rvAv)
local rvName = z(label(pReview, "", 20, true, C.text, UDim2.fromOffset(0, 78), UDim2.new(1, 0, 0, 26), Enum.TextXAlignment.Center))
local rvHandle = z(label(pReview, "", 14, false, Color3.fromRGB(106, 111, 129), UDim2.fromOffset(0, 104), UDim2.new(1, 0, 0, 20), Enum.TextXAlignment.Center))
local rvStats = z(label(pReview, "", 13, false, C.sub, UDim2.fromOffset(0, 128), UDim2.new(1, 0, 0, 18), Enum.TextXAlignment.Center))
local rvJoined = z(label(pReview, "", 13, false, C.sub, UDim2.fromOffset(0, 146), UDim2.new(1, 0, 0, 18), Enum.TextXAlignment.Center))
local rvAmt = z(label(pReview, "", 32, true, C.text, UDim2.fromOffset(0, 174), UDim2.new(1, 0, 0, 40), Enum.TextXAlignment.Center))
local rvGet = z(label(pReview, "", 14, false, C.sub, UDim2.fromOffset(0, 216), UDim2.new(1, 0, 0, 20), Enum.TextXAlignment.Center))
local rvSend = z(new("TextButton", { Text = "Send", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, Position = UDim2.fromOffset(17, 248), Size = UDim2.new(1, -34, 0, 50) }, pReview))
corner(rvSend, UDim.new(0, 12))
local rvEdit = z(new("TextButton", { Text = "Edit", TextSize = 18, Font = FONT_B, TextColor3 = C.text, BackgroundColor3 = Color3.fromRGB(226, 227, 232), Position = UDim2.fromOffset(17, 306), Size = UDim2.new(1, -34, 0, 50) }, pReview))
corner(rvEdit, UDim.new(0, 12))
local rvNote = z(label(pReview, "You need an age check or parental consent to send Robux. Once you send, you cannot cancel.", 12, false, C.sub, UDim2.fromOffset(24, 366), UDim2.new(1, -48, 0, 34), Enum.TextXAlignment.Center))
rvNote.TextWrapped = true

-- 4) enviado ("You sent N Robux" + OK)
local pSent = sPage("sent", 64)
local ck = z(new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 14), Size = UDim2.fromOffset(56, 56) }, pSent)); corner(ck)
new("UIStroke", { Color = Color3.fromRGB(73, 77, 90), Thickness = 3 }, ck)
z(label(ck, "\u{2713}", 30, true, Color3.fromRGB(73, 77, 90), nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center))
local sentMsg = z(label(pSent, "", 20, true, C.text, UDim2.fromOffset(0, 82), UDim2.new(1, 0, 0, 28), Enum.TextXAlignment.Center))
local sDone = z(new("TextButton", { Text = "OK", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, Position = UDim2.fromOffset(17, 130), Size = UDim2.new(1, -34, 0, 50) }, pSent))
corner(sDone, UDim.new(0, 12))

local function refreshBalances()
	for _, l in ipairs(balanceLabels) do l.Text = tostring(simBalance) end
end
refreshBalances()
local function fmt(n)
	local s = tostring(n)
	local r = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	return (r:gsub("^,", ""))
end
local SHEET_SIZE = { search = UDim2.new(1, 0, 0.86, 24), amount = UDim2.new(1, 0, 0, 364), review = UDim2.new(1, 0, 0, 504), sent = UDim2.new(1, 0, 0, 284) }
local function step(name)
	sShow(name)
	TweenService:Create(sSheet, TweenInfo.new(0.2, Enum.EasingStyle.Quad), { Size = SHEET_SIZE[name] }):Play()
end
goAmount = function(u)
	target = u
	aAv.Image = avatarOf(u.Id); aName.Text = (u.DisplayName ~= "" and u.DisplayName or u.Username)
	aBox.Text = ""
	updateNext()
	step("amount")
end
aNext.Activated:Connect(function()
	local n = amountNow()
	if n < 1 or n > simBalance then return end
	amount = n
	local d = (tonumber(tostring(target.Id):sub(-6)) or 7)
	rvAv.Image = avatarOf(target.Id)
	rvName.Text = (target.DisplayName ~= "" and target.DisplayName or target.Username)
	rvHandle.Text = "@" .. target.Username
	rvStats.Text = "Connected " .. (d % 23 + 1) .. " months  \u{00B7}  " .. (d % 15) .. " mutual Friends"
	rvJoined.Text = "Joined in " .. (2008 + d % 16)
	rvAmt.Text = utf8.char(0xE002) .. " " .. fmt(amount)
	rvAmt.Font = Enum.Font.BuilderSansBold
	rvGet.Text = "The recipient will get " .. fmt(amount) .. " Robux."
	step("review")
end)
rvEdit.Activated:Connect(function() step("amount") end)
rvSend.Activated:Connect(function()
	simBalance -= amount
	refreshBalances()
	sentMsg.Text = "You sent " .. fmt(amount) .. " Robux"
	step("sent")
end)

local function closeSend()
	TweenService:Create(sDim, TweenInfo.new(0.2), { BackgroundTransparency = 1 }):Play()
	local tw = TweenService:Create(sSheet, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 2, 0) })
	tw:Play()
	tw.Completed:Once(function() sendGui.Visible = false end)
end
sClose.Activated:Connect(closeSend)
sDone.Activated:Connect(closeSend)
sDim.Activated:Connect(closeSend)
openSendSheet = function()
	sBox.Text = ""
	sSheet.Size = SHEET_SIZE.search
	sShow("search")
	loadFriends()
	sendGui.Visible = true
	sDim.BackgroundTransparency = 1
	sSheet.Position = UDim2.new(0, 0, 1.4, 24)
	TweenService:Create(sDim, TweenInfo.new(0.2), { BackgroundTransparency = 0.6 }):Play()
	TweenService:Create(sSheet, TweenInfo.new(0.25, Enum.EasingStyle.Quart, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, 24) }):Play()
end


-- ======== Pantalla Robux (solo saldo de juguete y Send; sin paquetes ni compras) ========
local rbxPage = new("Frame", { Name = "RobuxPage", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(247, 247, 248), BorderSizePixel = 0, Visible = false, ZIndex = 70 }, root)
local rbxTop = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 74), ZIndex = 71 }, rbxPage)
local rbxX = new("TextButton", { Text = "", BackgroundColor3 = Color3.fromRGB(231, 232, 236), AutoButtonColor = true, Position = UDim2.fromOffset(18, 34), Size = UDim2.fromOffset(34, 34), ZIndex = 72 }, rbxTop)
xMark(rbxX, C.text, 16)
corner(rbxX)
hexIcon(rbxTop, 22, UDim2.fromOffset(70, 40), C.text).ZIndex = 72
local rbxBal = label(rbxTop, tostring(simBalance), 26, true, C.text, UDim2.fromOffset(98, 36), UDim2.fromOffset(150, 32))
rbxBal.ZIndex = 72
balanceLabels[#balanceLabels + 1] = rbxBal
local rbxSend = new("TextButton", { Text = "\u{2191} Send", TextSize = 14, Font = FONT, TextColor3 = C.text, BackgroundColor3 = Color3.fromRGB(221, 222, 227), AutoButtonColor = true, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 35), Size = UDim2.fromOffset(66, 28), ZIndex = 72 }, rbxTop)
corner(rbxSend, UDim.new(0, 8))
local rbxBody = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 74), Size = UDim2.new(1, 0, 1, -74), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 71 }, rbxPage)
new("UIPadding", { PaddingLeft = UDim.new(0, 18), PaddingRight = UDim.new(0, 18), PaddingTop = UDim.new(0, 10) }, rbxBody)
new("UIListLayout", { Padding = UDim.new(0, 12), SortOrder = Enum.SortOrder.LayoutOrder }, rbxBody)
local ptitle = label(rbxBody, "Robux packages", 22, true, C.text, nil, UDim2.new(1, 0, 0, 30))
ptitle.ZIndex = 71
ptitle.LayoutOrder = 1
local pterms = label(rbxBody, "By purchasing Robux, you agree to our Terms of Use, including the arbitration clause and revocation policy.", 13, false, C.text, nil, UDim2.new(1, 0, 0, 34))
pterms.ZIndex = 71
pterms.LayoutOrder = 2
pterms.TextWrapped = true
pterms.TextYAlignment = Enum.TextYAlignment.Top
-- lista de paquetes: SOLO interfaz, los botones no compran nada
local pcard = new("Frame", { BackgroundColor3 = Color3.fromRGB(247, 247, 248), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 10 * 53 + 24), LayoutOrder = 3, ZIndex = 71 }, rbxBody)
corner(pcard, UDim.new(0, 18))
new("UIStroke", { Color = Color3.fromRGB(232, 233, 236), Thickness = 1 }, pcard)
new("UIPadding", { PaddingTop = UDim.new(0, 12), PaddingLeft = UDim.new(0, 18), PaddingRight = UDim.new(0, 18) }, pcard)
new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder }, pcard)
local PACKS = { { 22500, "\u{20AC}239.99" }, { 10000, "\u{20AC}119.99" }, { 4500, "\u{20AC}59.99" }, { 3150, "\u{20AC}39.99" }, { 1700, "\u{20AC}23.99" }, { 1200, "\u{20AC}17.99", true }, { 800, "\u{20AC}11.99" }, { 400, "\u{20AC}5.99" }, { 80, "\u{20AC}1.19" }, { 40, "\u{20AC}0.60" } }
local function commas(n) local t = tostring(n):reverse():gsub("(%d%d%d)", "%1,"):reverse(); return (t:gsub("^,", "")) end
for i, pk in ipairs(PACKS) do
	local r = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 53), LayoutOrder = i, ZIndex = 72 }, pcard)
	glyph(r, "robux", 22, UDim2.fromOffset(0, 14), C.text).ZIndex = 72
	local am = label(r, commas(pk[1]), 22, true, C.text, UDim2.fromOffset(28, 10), UDim2.fromOffset(110, 30)); am.ZIndex = 72
	if pk[3] then
		local chip = new("TextLabel", { BackgroundColor3 = Color3.fromRGB(231, 232, 236), Text = "For you", TextSize = 12, Font = FONT_B, TextColor3 = Color3.fromRGB(74, 77, 86), Position = UDim2.fromOffset(102, 17), Size = UDim2.fromOffset(66, 20), ZIndex = 72 }, r)
		corner(chip)
	end
	local btn = new("TextButton", { Text = pk[2], TextSize = 15, Font = FONT_B, TextColor3 = pk[3] and Color3.new(1, 1, 1) or C.text, BackgroundColor3 = pk[3] and C.blue or Color3.fromRGB(221, 222, 227), AutoButtonColor = false, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, 0, 0.5, 0), Size = UDim2.fromOffset(106, 35), ZIndex = 72 }, r)
	corner(btn, UDim.new(0, 8))
end
local ft = label(rbxBody, "FAQ", 22, true, C.text, nil, UDim2.new(1, 0, 0, 30))
ft.ZIndex = 71
ft.LayoutOrder = 10
for i, q in ipairs({ "What are Robux?", "How do I send Robux?", "Where can I use Robux?" }) do
	local card = new("Frame", { BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 50), LayoutOrder = 10 + i, ZIndex = 71 }, rbxBody)
	corner(card, UDim.new(0, 12))
	new("UIStroke", { Color = Color3.fromRGB(215, 217, 223), Thickness = 1.2 }, card)
	local ql = label(card, q, 15, true, C.text, UDim2.fromOffset(16, 0), UDim2.new(1, -50, 1, 0))
	ql.ZIndex = 72
	local ch = label(card, "\u{2304}", 20, false, C.text, UDim2.new(1, -36, 0, 0), UDim2.fromOffset(24, 50), Enum.TextXAlignment.Center)
	ch.ZIndex = 72
end
rbxX.Activated:Connect(function() rbxPage.Visible = false end)
rbxSend.Activated:Connect(function() if openSendSheet then openSendSheet() end end)
openRobuxPage = function() rbxPage.Visible = true end

-- ======== Panel al mantener presionado: nombre, Plus / Verified y cantidad ========
local UserInputService = game:GetService("UserInputService")
local editGui = new("Frame", { Name = "EditPanel", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 95 }, root)
local eDim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.5, Size = UDim2.fromScale(1, 1), ZIndex = 95 }, editGui)
local eSheet = new("Frame", { BackgroundColor3 = Color3.fromRGB(247, 247, 248), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 24), Size = UDim2.new(1, 0, 0, 424), ZIndex = 96 }, editGui)
corner(eSheet, UDim.new(0, 20))
new("Frame", { BackgroundColor3 = Color3.fromRGB(200, 202, 208), BorderSizePixel = 0, Position = UDim2.new(0.5, -17, 0, 8), Size = UDim2.fromOffset(34, 4), ZIndex = 97 }, eSheet)
local function ez(o) o.ZIndex = 97; return o end
ez(label(eSheet, "Edit", 22, true, C.text, UDim2.fromOffset(18, 20), UDim2.fromOffset(200, 30)))

local function applyProfile()
	local t = profile.name
	if profile.verified then t = t .. "  " .. GLYPH.verified end
	if profile.plus then t = t .. "  " .. GLYPH.plus end
	for _, l in ipairs(nameLabels) do l.Text = t end
end

local function field(y, title, placeholder, initial, numeric, onDone)
	ez(label(eSheet, title, 14, false, C.sub, UDim2.fromOffset(18, y), UDim2.new(1, -36, 0, 18)))
	local f = ez(new("Frame", { BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0, Position = UDim2.fromOffset(18, y + 22), Size = UDim2.new(1, -36, 0, 44) }, eSheet))
	corner(f, UDim.new(0, 12)); new("UIStroke", { Color = Color3.fromRGB(207, 209, 215), Thickness = 1 }, f)
	local box = ez(new("TextBox", { BackgroundTransparency = 1, Text = initial, PlaceholderText = placeholder, PlaceholderColor3 = C.sub, TextSize = 18, Font = FONT, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -28, 1, 0) }, f))
	if numeric then
		box:GetPropertyChangedSignal("Text"):Connect(function()
			local t = box.Text:gsub("%D", ""):sub(1, 9)
			if t ~= box.Text then box.Text = t end
		end)
	end
	box.FocusLost:Connect(function() onDone(box.Text) end)
	return box
end
local function toggle(y, title, get, set)
	ez(label(eSheet, title, 17, true, C.text, UDim2.fromOffset(18, y), UDim2.new(1, -110, 0, 28)))
	local sw = ez(new("TextButton", { Text = "", AutoButtonColor = false, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, y - 1), Size = UDim2.fromOffset(52, 30) }, eSheet))
	corner(sw)
	local knob = ez(new("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Size = UDim2.fromOffset(24, 24), Position = UDim2.fromOffset(3, 3) }, sw))
	corner(knob)
	local function paint()
		local on = get()
		sw.BackgroundColor3 = on and C.blue or Color3.fromRGB(200, 202, 208)
		knob.Position = on and UDim2.fromOffset(25, 3) or UDim2.fromOffset(3, 3)
	end
	paint()
	sw.Activated:Connect(function() set(not get()); paint(); applyProfile() end)
end
local nameBox, amtBox
-- 1) cambiar nombre
nameBox = field(60, "Change name", "Display name", profile.name, false, function(t)
	t = t:gsub("^%s+", ""):gsub("%s+$", "")
	if t ~= "" then profile.name = t; applyProfile() end
end)
-- 2) activar Roblox Plus / Verified badge
ez(label(eSheet, "Badges", 14, false, C.sub, UDim2.fromOffset(18, 146), UDim2.new(1, -36, 0, 18)))
toggle(172, "Roblox Plus", function() return profile.plus end, function(v) profile.plus = v end)
toggle(216, "Verified badge", function() return profile.verified end, function(v) profile.verified = v end)
-- 3) cambiar la cantidad
amtBox = field(264, "Change amount", "0", tostring(simBalance), true, function(t)
	local n = tonumber(t)
	if n then simBalance = n; refreshBalances() end
end)
local eDone = ez(new("TextButton", { Text = "Done", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, Position = UDim2.fromOffset(18, 352), Size = UDim2.new(1, -36, 0, 50) }, eSheet))
corner(eDone, UDim.new(0, 12))
local function closeEdit()
	if nameBox:IsFocused() then nameBox:ReleaseFocus() end
	if amtBox:IsFocused() then amtBox:ReleaseFocus() end
	TweenService:Create(eDim, TweenInfo.new(0.23), { BackgroundTransparency = 1 }):Play()
	local tw = TweenService:Create(eSheet, TweenInfo.new(0.23, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 1, 460) })
	tw:Play()
	tw.Completed:Once(function() editGui.Visible = false end)
end
eDim.Activated:Connect(closeEdit)
eDone.Activated:Connect(closeEdit)
local function openEdit()
	nameBox.Text = profile.name
	amtBox.Text = tostring(simBalance)
	editGui.Visible = true
	eDim.BackgroundTransparency = 1
	eSheet.Position = UDim2.new(0, 0, 1, 460)
	TweenService:Create(eDim, TweenInfo.new(0.25), { BackgroundTransparency = 0.38 }):Play()
	TweenService:Create(eSheet, TweenInfo.new(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, 24) }):Play()
end

-- mantener presionado ~0.8 s en cualquier parte (sin mover el dedo) abre el panel
local holdToken, holdStart = 0, nil
UserInputService.InputBegan:Connect(function(input)
	if input.UserInputType ~= Enum.UserInputType.Touch and input.UserInputType ~= Enum.UserInputType.MouseButton1 then return end
	if editGui.Visible then return end
	holdToken += 1
	local my = holdToken
	holdStart = input.Position
	task.delay(0.8, function()
		if my == holdToken and not editGui.Visible then openEdit() end
	end)
end)
UserInputService.InputChanged:Connect(function(input)
	if holdStart and (input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseMovement) then
		if (Vector2.new(input.Position.X, input.Position.Y) - Vector2.new(holdStart.X, holdStart.Y)).Magnitude > 14 then holdToken += 1; holdStart = nil end
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then holdToken += 1; holdStart = nil end
end)

local openFriendsPage
-- ======== Amigos (falsos) ========
local FRIENDS = {
	{ "Sakura", "sakura_x", 1, "Online" }, { "BlockMaster", "blockmaster", 156, "Playing Adopt Me!" }, { "NoobSlayer22", "noobslayer22", 261, "Online" },
	{ "PixelFox", "pixelfox", 7, "Offline" }, { "Luna", "luna_rbx", 12, "Playing Blox Fruits" }, { "Juan", "therealjuan", 16, "Offline" },
	{ "Mika", "mika123", 22, "Online" }, { "ProBuilder", "probuilder", 35, "Playing Bloxburg" }, { "Cami", "cami_play", 48, "Offline" }, { "Dani", "dani_games", 59, "Online" },
}
local friendsPage = new("Frame", { Name = "FriendsPage", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0, Visible = false, ZIndex = 75 }, root)
local function fz(o) o.ZIndex = 76; return o end
local fBack = fz(new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.fromOffset(6, 14), Size = UDim2.fromOffset(44, 44) }, friendsPage))
for _, r in ipairs({ 40, -40 }) do
	new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, -2, 0.5, r > 0 and -5 or 5), Size = UDim2.fromOffset(14, 2.4), Rotation = r, ZIndex = 77 }, fBack)
end
fz(label(friendsPage, "Friends", 26, true, C.text, UDim2.fromOffset(56, 18), UDim2.fromOffset(200, 36)))
local fSearch = fz(new("Frame", { BackgroundColor3 = Color3.fromRGB(236, 237, 241), Position = UDim2.fromOffset(16, 70), Size = UDim2.new(1, -32, 0, 36) }, friendsPage))
corner(fSearch, UDim.new(0, 10))
local fBox = fz(new("TextBox", { BackgroundTransparency = 1, Text = "", PlaceholderText = "Search friends", PlaceholderColor3 = C.sub, TextSize = 16, Font = FONT, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -28, 1, 0) }, fSearch))
local fHead = fz(label(friendsPage, "Friends (" .. #FRIENDS .. ")", 17, true, C.text, UDim2.fromOffset(16, 122), UDim2.new(1, -32, 0, 24)))
local fList = fz(new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 152), Size = UDim2.new(1, 0, 1, -152), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, friendsPage))
new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder }, fList)
local function renderFriends(filter)
	for _, c in ipairs(fList:GetChildren()) do if c:IsA("GuiObject") then c:Destroy() end end
	local n = 0
	for i, f in ipairs(FRIENDS) do
		if filter == "" or f[1]:lower():find(filter, 1, true) or f[2]:find(filter, 1, true) then
			n += 1
			local r = fz(new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 64), LayoutOrder = i }, fList))
			local av = fz(new("ImageLabel", { BackgroundColor3 = Color3.fromRGB(227, 228, 232), Image = "rbxthumb://type=AvatarHeadShot&id=" .. f[3] .. "&w=150&h=150", Position = UDim2.fromOffset(16, 8), Size = UDim2.fromOffset(48, 48) }, r))
			corner(av)
			if f[4] ~= "Offline" then
				local dot = fz(new("Frame", { BackgroundColor3 = f[4] == "Online" and Color3.fromRGB(60, 190, 110) or C.blue, BorderSizePixel = 0, Position = UDim2.fromOffset(52, 44), Size = UDim2.fromOffset(14, 14) }, r))
				corner(dot); new("UIStroke", { Color = C.bg, Thickness = 2 }, dot)
			end
			fz(label(r, f[1], 16, true, C.text, UDim2.fromOffset(76, 10), UDim2.new(1, -92, 0, 22)))
			fz(label(r, f[4], 13, false, C.sub, UDim2.fromOffset(76, 33), UDim2.new(1, -92, 0, 18)))
		end
	end
	fHead.Text = "Friends (" .. n .. ")"
end
renderFriends("")
fBox:GetPropertyChangedSignal("Text"):Connect(function() renderFriends(fBox.Text:lower()) end)
fBack.Activated:Connect(function() friendsPage.Visible = false end)
local closeDrawer
openFriendsPage = function() friendsPage.Visible = true end

-- ======== Panel lateral (menu de las 3 rayas) ========
local DR_W = 333
local drawerGui = new("Frame", { Name = "Drawer", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 50 }, root)
local scrim = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, Size = UDim2.fromScale(1, 1), ZIndex = 50 }, drawerGui)
local drawer = new("Frame", { BackgroundColor3 = C.bg, BorderSizePixel = 0, Position = UDim2.fromOffset(-DR_W, 0), Size = UDim2.new(0, DR_W, 1, 0), ZIndex = 51, ClipsDescendants = true }, drawerGui)
local dScroll = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Size = UDim2.fromScale(1, 1), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 51 }, drawer)
new("UIPadding", { PaddingLeft = UDim.new(0, 18), PaddingRight = UDim.new(0, 18), PaddingTop = UDim.new(0, 40), PaddingBottom = UDim.new(0, 24) }, dScroll)
new("UIListLayout", { Padding = UDim.new(0, 0), SortOrder = Enum.SortOrder.LayoutOrder }, dScroll)
local ord = 0
local function nextOrd() ord += 1; return ord end
-- perfil
local prof = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 84), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
local pAv = new("ImageLabel", { BackgroundColor3 = C.gray, Size = UDim2.fromOffset(60, 60), Image = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150", ZIndex = 51 }, prof)
corner(pAv)
local pn = label(prof, profile.name, 22, true, C.text, UDim2.fromOffset(74, 8), UDim2.new(1, -74, 0, 28)); pn.ZIndex = 51
nameLabels[#nameLabels + 1] = pn
local pu = label(prof, "@" .. player.Name:lower(), 19, false, C.sub, UDim2.fromOffset(74, 36), UDim2.new(1, -74, 0, 24)); pu.ZIndex = 51
local function gap(h) new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, h), LayoutOrder = nextOrd() }, dScroll) end
gap(10)
do
	local card = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 64), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
	new("UIStroke", { Color = C.line, Thickness = 1.5 }, card)
	corner(card, UDim.new(0, 14))
	hexIcon(card, 26, UDim2.fromOffset(14, 19), C.text).ZIndex = 51
	local bl = label(card, tostring(simBalance), 24, true, C.text, UDim2.fromOffset(52, 16), UDim2.fromOffset(110, 32)); bl.ZIndex = 51
	balanceLabels[#balanceLabels + 1] = bl
	local sb = new("TextButton", { Text = "Robux", TextSize = 16, Font = FONT, TextColor3 = C.text, BackgroundColor3 = C.gray, AutoButtonColor = true, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0), Size = UDim2.fromOffset(86, 40), ZIndex = 51 }, card)
	corner(sb, UDim.new(0, 12))
	sb.Activated:Connect(function() if openRobuxPage then openRobuxPage() end end)
end
gap(10)
local function row(text, badge, key)
	local r = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 41), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
	local ic = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(2, 9), Size = UDim2.fromOffset(22, 22), ZIndex = 51 }, r)
	if key == "plus" then
		glyph(ic, "plus", 20, UDim2.fromOffset(-1, -1), C.text).ZIndex = 51
	elseif key and (DICONS[key] or "") ~= "" then
		new("ImageLabel", { BackgroundTransparency = 1, Image = DICONS[key], ImageColor3 = C.text, Size = UDim2.fromScale(1, 1), ZIndex = 51 }, ic)
	else
		corner(ic, UDim.new(0.3, 0)); new("UIStroke", { Color = C.text, Thickness = 1.8 }, ic)
	end
	local t = label(r, text, 19, true, C.text, UDim2.fromOffset(42, 0), UDim2.new(1, -90, 1, 0)); t.ZIndex = 51
	if badge then
		local b = new("Frame", { BackgroundColor3 = C.blue, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -2, 0.5, 0), Size = UDim2.fromOffset(18, 18), ZIndex = 51 }, r)
		corner(b)
		label(b, tostring(badge), 12, true, Color3.new(1, 1, 1), nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center).ZIndex = 52
	end
	return r
end
for _, it in ipairs({ { "Favorites", nil, "favorites" }, { "Continue Playing", nil, "continue" }, { "Friends", nil, "friends" }, { "Communities", nil, "communities" }, { "Inventory", nil, "inventory" }, { "Trades", nil, "trades" }, { "Messages", 4, "messages" }, { "Roblox Plus", nil, "plus" }, { "Settings", 1, "settings" }, { "Help & Safety", nil, "help" } }) do
	local r = row(it[1], it[2], it[3])
	if it[1] == "Friends" then r.Activated:Connect(function() if closeDrawer then closeDrawer() end; openFriendsPage() end) end
end
gap(8)
new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 2), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
gap(8)
for _, it in ipairs({ { "Moments", "moments" }, { "Learn", "learn" }, { "Create", "create" } }) do row(it[1], nil, it[2]) end
gap(10)
for _, nm in ipairs({ "Switch Accounts", "Quick Sign-in", "Log Out" }) do
	local b = new("TextButton", { Text = nm, TextSize = 17, Font = FONT, TextColor3 = C.text, BackgroundColor3 = C.gray, AutoButtonColor = true, Size = UDim2.new(1, 0, 0, 44), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
	corner(b, UDim.new(0, 12))
	gap(8)
end
local foot = label(dScroll, "Terms    Privacy", 14, false, C.sub, nil, UDim2.new(1, 0, 0, 24)); foot.LayoutOrder = nextOrd(); foot.ZIndex = 51
foot.TextXAlignment = Enum.TextXAlignment.Center

local drawerOpen = false
local function setDrawer(on)
	drawerOpen = on
	if on then drawerGui.Visible = true end
	TweenService:Create(scrim, TweenInfo.new(0.22), { BackgroundTransparency = on and 0.45 or 1 }):Play()
	local tw = TweenService:Create(drawer, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = UDim2.fromOffset(on and 0 or -DR_W, 0) })
	tw:Play()
	if not on then tw.Completed:Once(function() if not drawerOpen then drawerGui.Visible = false end end) end
end
scrim.Activated:Connect(function() setDrawer(false) end)
closeDrawer = function() setDrawer(false) end
openDrawerFromAvatar = function() scrim.BackgroundTransparency = 1; setDrawer(true) end
scrim.BackgroundTransparency = 1

-- boton del menu en la cabecera de Home
local hdMenuBtn = new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.fromOffset(8, 6), Size = UDim2.fromOffset(52, 44), ZIndex = 5 }, header)
hdMenuBtn.Activated:Connect(function() openDrawerFromAvatar() end)

selectTab("For you")

-- ======== Botones de la cabecera de Home y paginas que abren (como en la app) ========
local PFP = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150"
local function hit(parent, pos, size, fn)
	local b = new("TextButton", { Text = "", BackgroundTransparency = 1, Position = pos, Size = size, ZIndex = 6 }, parent)
	b.Activated:Connect(fn)
	return b
end

-- Buscar: campo + Cancel + "Try searching for" + chips
local searchPage = new("Frame", { Name = "SearchPage", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0, Visible = false, ZIndex = 60 }, root)
local spField = new("Frame", { BackgroundColor3 = Color3.fromRGB(236, 237, 241), Position = UDim2.fromOffset(12, 16), Size = UDim2.new(1, -92, 0, 34), ZIndex = 61 }, searchPage)
corner(spField, UDim.new(0, 10))
local spBox = new("TextBox", { BackgroundTransparency = 1, Text = "", PlaceholderText = "Search", PlaceholderColor3 = C.sub, TextSize = 17, Font = FONT, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(38, 0), Size = UDim2.new(1, -46, 1, 0), ZIndex = 62 }, spField)
do
	local c = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(11, 8), Size = UDim2.fromOffset(14, 14), ZIndex = 62 }, spField)
	corner(c); new("UIStroke", { Color = C.text, Thickness = 1.8 }, c)
	new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(24, 24), Size = UDim2.fromOffset(6, 2), Rotation = 45, ZIndex = 62 }, spField)
end
local spCancel = new("TextButton", { Text = "Cancel", TextSize = 17, Font = FONT, TextColor3 = C.text, BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -8, 0, 16), Size = UDim2.fromOffset(66, 34), ZIndex = 61 }, searchPage)
local spTry = label(searchPage, "Try searching for", 22, true, C.text, UDim2.fromOffset(14, 72), UDim2.new(1, -28, 0, 30)); spTry.ZIndex = 61
local spChips = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Position = UDim2.fromOffset(0, 112), Size = UDim2.new(1, 0, 0, 44), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X, ZIndex = 61 }, searchPage)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }, spChips)
new("UIPadding", { PaddingLeft = UDim.new(0, 14) }, spChips)
for _, nm in ipairs({ "Tycoon", "Escape", "Survival", "Story", "Horror", "Obby", "Simulator", "Roleplay" }) do
	local ch = new("TextButton", { Text = nm, TextSize = 16, Font = FONT, TextColor3 = C.text, BackgroundColor3 = Color3.fromRGB(236, 237, 241), AutoButtonColor = true, AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 36), ZIndex = 62 }, spChips)
	corner(ch); new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14) }, ch)
	ch.Activated:Connect(function() spBox.Text = nm end)
end
spCancel.Activated:Connect(function() spBox.Text = ""; searchPage.Visible = false end)
local function openSearchPage() searchPage.Visible = true; spBox:CaptureFocus() end

-- botones de la cabecera: buscar, Robux, campana (la campana no abre nada, igual que en la app)
hit(header, UDim2.new(1, -124, 0, 6), UDim2.fromOffset(40, 44), openSearchPage)
hit(header, UDim2.new(1, -86, 0, 6), UDim2.fromOffset(40, 44), function() if openRobuxPage then openRobuxPage() end end)

-- Chat: titulo, buscar, redactar, y dos filas
local chatPage = new("Frame", { Name = "ChatPage", Size = UDim2.new(1, 0, 1, -64), BackgroundColor3 = C.bg, BorderSizePixel = 0, Visible = false }, root)
icon(chatPage, "menu", UDim2.fromOffset(16, 22), UDim2.fromOffset(26, 24), function(h)
	for i = 0, 2 do new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Position = UDim2.new(0, 0, 0, i * 10), Size = UDim2.new(1, 0, 0, 2) }, h) end
	local dot = new("Frame", { BackgroundColor3 = C.blue, BorderSizePixel = 0, Position = UDim2.new(1, -6, 0, -8), Size = UDim2.fromOffset(9, 9) }, h)
	corner(dot)
end)
hit(chatPage, UDim2.fromOffset(6, 12), UDim2.fromOffset(50, 44), function() if openDrawerFromAvatar then openDrawerFromAvatar() end end)
label(chatPage, "Chat", 30, true, C.text, UDim2.fromOffset(58, 14), UDim2.fromOffset(140, 40))
icon(chatPage, "search", UDim2.new(1, -78, 0, 21), UDim2.fromOffset(26, 26), function(h)
	local c = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(20, 20) }, h)
	corner(c); new("UIStroke", { Color = C.text, Thickness = 2.2 }, c)
	new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(21, 21), Size = UDim2.fromOffset(8, 2.5), Rotation = 45 }, h)
end)
local compose = new("Frame", { BackgroundTransparency = 1, Position = UDim2.new(1, -40, 0, 22), Size = UDim2.fromOffset(22, 22) }, chatPage)
corner(compose, UDim.new(0.2, 0)); new("UIStroke", { Color = C.text, Thickness = 2 }, compose)
local function chatRow(y, title, sub)
	local r = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, y), Size = UDim2.new(1, 0, 0, 58) }, chatPage)
	local ic = new("Frame", { BackgroundColor3 = Color3.fromRGB(236, 237, 241), Position = UDim2.fromOffset(14, 10), Size = UDim2.fromOffset(34, 34) }, r)
	corner(ic, UDim.new(0, 8))
	label(r, title, 16, true, C.text, UDim2.fromOffset(62, 8), UDim2.new(1, -110, 0, 20))
	label(r, sub, 12.5, false, C.sub, UDim2.fromOffset(62, 29), UDim2.new(1, -110, 0, 16))
	label(r, "\u{203A}", 26, false, C.text, UDim2.new(1, -40, 0, 8), UDim2.fromOffset(26, 36), Enum.TextXAlignment.Center)
	new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Position = UDim2.fromOffset(62, 57), Size = UDim2.new(1, -76, 0, 1) }, r)
end
chatRow(76, "Start party", "Join experiences together")
chatRow(134, "Communities", "Create and explore communities")

-- ======== Barra inferior ========
local nav = new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 64), BackgroundColor3 = C.bg, BorderSizePixel = 0 }, root)
new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 1) }, nav)
local items = { { "Home", "home" }, { "Moments", "moments" }, { "Chat", "chat" }, { "Me", "me" } }
local navLabels, navIcons = {}, {}
local function selectNav(name)
	if name == "Moments" then return end -- en la app original no abre nada
	currentNav = name
	chatPage.Visible = (name == "Chat")
	for n, l in pairs(navLabels) do
		l.TextColor3 = (n == name) and C.text or C.sub
		l.Font = (n == name) and FONT_B or FONT
	end
	for n, h in pairs(navIcons) do
		local img = h:FindFirstChild("Img")
		if img then
			img.ImageColor3 = (n == name) and C.text or C.sub
			if n == "Home" and ICONS.home_filled ~= "" and ICONS.home ~= "" then img.Image = (name == "Home") and ICONS.home_filled or ICONS.home end
		end
	end
	content.Visible = (name == "Home")
	header.Visible = (name == "Home"); tabsBar.Visible = (name == "Home")
	avScreen.Visible = (name == "Me")
	showPages()
end
for i, it in ipairs(items) do
	local b = new("TextButton", { Text = "", BackgroundTransparency = 1, Position = UDim2.new((i - 1) / 4, 0, 0, 0), Size = UDim2.new(0.25, 0, 1, 0) }, nav)
	local ic = icon(b, it[2], UDim2.new(0.5, -14, 0, 8), UDim2.fromOffset(28, 28), function(h)
		if it[2] == "me" then
			local c = new("ImageLabel", { BackgroundColor3 = C.gray, Image = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150", Size = UDim2.fromScale(1, 1) }, h); corner(c)
		else
			local sh = new("Frame", { BackgroundColor3 = (it[2] == "home") and C.text or Color3.fromRGB(0, 0, 0), BackgroundTransparency = (it[2] == "home") and 0 or 1, BorderSizePixel = 0, Position = UDim2.fromOffset(3, 5), Size = UDim2.fromOffset(22, 18) }, h)
			corner(sh, UDim.new(0.2, 0))
			if it[2] ~= "home" then new("UIStroke", { Color = C.sub, Thickness = 2 }, sh) end
		end
	end)
	navIcons[it[1]] = ic
	navLabels[it[1]] = label(b, it[1], 13, false, C.sub, UDim2.fromOffset(0, 40), UDim2.new(1, 0, 0, 18), Enum.TextXAlignment.Center)
	b.Activated:Connect(function() selectNav(it[1]) end)
end
selectNav("Home")
