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
-- saldo de JUGUETE (solo simulacion, no es Robux real)
local simBalance = 1000
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
local function tilesRow(parent, count, w, h, order)
	local row = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Size = UDim2.new(1, 0, 0, h + 44), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X, LayoutOrder = order }, parent)
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, row)
	for i = 1, count do
		local t = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(w, h + 40) }, row)
		local img = new("Frame", { BackgroundColor3 = C.tile, BorderSizePixel = 0, Size = UDim2.fromOffset(w, h) }, t)
		corner(img, UDim.new(0, 10))
		label(t, "Experience " .. i, 15, true, C.text, UDim2.fromOffset(0, h + 4), UDim2.new(1, 0, 0, 20))
		label(t, "-- players", 13, false, C.sub, UDim2.fromOffset(0, h + 22), UDim2.new(1, 0, 0, 16))
	end
	return row
end

-- ---- For you ----
local forYou = page("For you")
-- usuario
local userRow = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 56), LayoutOrder = 1 }, forYou)
local av = new("ImageLabel", { BackgroundColor3 = C.gray, Size = UDim2.fromOffset(52, 52), Image = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150" }, userRow); corner(av)
new("UIStroke", { Color = C.line, Thickness = 1 }, av)
label(userRow, player.DisplayName, 26, true, C.text, UDim2.fromOffset(66, 10), UDim2.new(1, -66, 0, 34))
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

-- ---- Charts ----
local charts = page("Charts")
-- filtros: dispositivo y pais (pildoras oscuras)
local filters = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 36), LayoutOrder = 1 }, charts)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, filters)
for _, nm in ipairs({ "Standard Phone", "United States" }) do
	local b = new("TextButton", { Text = nm .. "  \u{2304}", TextSize = 16, Font = FONT, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = Color3.fromRGB(24, 25, 29), AutoButtonColor = true, AutomaticSize = Enum.AutomaticSize.X, Size = UDim2.fromOffset(0, 32) }, filters)
	corner(b)
	new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14) }, b)
end
local function chartSection(title, subtitle, order)
	local f = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = order }, charts)
	new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, f)
	local head = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, subtitle and 50 or 32), LayoutOrder = 0 }, f)
	label(head, title .. "  \u{203A}", 24, true, C.text, UDim2.fromOffset(0, 0), UDim2.new(1, -40, 0, 30))
	if subtitle then label(head, subtitle, 15, false, C.sub, UDim2.fromOffset(0, 28), UDim2.new(1, -40, 0, 20)) end
	local info = new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 4), Size = UDim2.fromOffset(20, 20) }, head)
	corner(info); new("UIStroke", { Color = C.text, Thickness = 1.6 }, info)
	label(info, "i", 13, true, C.text, nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center)
	tilesRow(f, 6, 150, 150, 1)
	return f
end
chartSection("Top Trending", nil, 2)
chartSection("Up-and-Coming", nil, 3)
chartSection("Top Playing Now", "Results for all devices and locations", 4)
chartSection("Fun with Friends", nil, 5)
chartSection("Top Revisited", nil, 6)

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

local searchToken = 0
local function fillRow(row, items, from, to, cat)
	for i = from, to do
		local it = items[i]
		if not it then break end
		local cell = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, Size = UDim2.new(0.333, -7, 1, 0), LayoutOrder = i }, row)
		corner(cell, UDim.new(0, 12))
		new("ImageLabel", { BackgroundTransparency = 1, Image = "rbxthumb://type=Asset&id=" .. it.Id .. "&w=150&h=150", Size = UDim2.fromScale(1, 1), ScaleType = Enum.ScaleType.Fit }, cell)
		cell.Activated:Connect(function() wear(it.Id, cat[3]) end)
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
				cell.Activated:Connect(function() wear(it.Id, cat[3]) end)
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
local sSheet = new("Frame", { BackgroundColor3 = Color3.fromRGB(247, 247, 249), BorderSizePixel = 0, AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 0), Size = UDim2.new(1, 0, 0.86, 0), ZIndex = 81, ClipsDescendants = true }, sendGui)
corner(sSheet, UDim.new(0, 22))
local function z(o, n) o.ZIndex = n or 82; return o end
-- cabecera
local sHex = glyph(sSheet, "plus", 22, UDim2.fromOffset(15, 18), Color3.fromRGB(73, 77, 90))
local sTitle = z(label(sSheet, "Send Robux", 19, true, Color3.fromRGB(73, 77, 90), UDim2.fromOffset(45, 19), UDim2.fromOffset(200, 26)))
local sBalHex = hexIcon(sSheet, 16, UDim2.new(1, -104, 0, 23), Color3.fromRGB(32, 34, 39))
local sBal = z(label(sSheet, "", 15, false, Color3.fromRGB(32, 34, 39), UDim2.new(1, -84, 0, 19), UDim2.fromOffset(46, 22)))
balanceLabels[#balanceLabels + 1] = sBal
local sClose = z(new("TextButton", { Text = "\u{2715}", TextSize = 18, Font = FONT, TextColor3 = C.text, BackgroundTransparency = 1, Position = UDim2.new(1, -44, 0, 16), Size = UDim2.fromOffset(32, 32) }, sSheet))

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
			showUsers({}, "People (0)")
			sEmpty.Text = "No users found"
		end
	end)
end)

-- 2) monto
local pAmount = sPage("amount")
local aRow = z(new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, 0), Size = UDim2.new(1, 0, 0, 60) }, pAmount))
local aAv = z(new("ImageLabel", { BackgroundColor3 = C.gray, Position = UDim2.fromOffset(18, 8), Size = UDim2.fromOffset(44, 44) }, aRow)); corner(aAv)
local aName = z(label(aRow, "", 18, true, C.text, UDim2.fromOffset(74, 8), UDim2.new(1, -90, 0, 24)))
local aUser = z(label(aRow, "", 15, false, C.sub, UDim2.fromOffset(74, 32), UDim2.new(1, -90, 0, 20)))
z(label(pAmount, "Amount", 16, false, C.sub, UDim2.fromOffset(18, 84), UDim2.new(1, -36, 0, 22)))
local aBox = z(new("TextBox", { BackgroundTransparency = 1, Text = "", PlaceholderText = "0", PlaceholderColor3 = Color3.fromRGB(190, 192, 200), TextSize = 44, Font = FONT_B, TextColor3 = C.text, ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(64, 106), Size = UDim2.new(1, -90, 0, 60) }, pAmount))
hexIcon(pAmount, 34, UDim2.fromOffset(20, 119), C.text)
local aAvail = z(label(pAmount, "", 15, false, C.sub, UDim2.fromOffset(18, 172), UDim2.new(1, -36, 0, 22)))
local aNext = z(new("TextButton", { Text = "Continue", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, AutoButtonColor = true, Position = UDim2.fromOffset(18, 214), Size = UDim2.new(1, -36, 0, 50) }, pAmount))
corner(aNext, UDim.new(0, 12))
local function validAmount()
	local n = tonumber(aBox.Text) or 0
	return n >= 1 and n <= simBalance and n == math.floor(n)
end
aBox:GetPropertyChangedSignal("Text"):Connect(function()
	local t = aBox.Text:gsub("%D", "")
	if t ~= aBox.Text then aBox.Text = t end
	aNext.BackgroundColor3 = validAmount() and C.blue or Color3.fromRGB(190, 200, 235)
end)

-- 3) revisar
local pReview = sPage("review")
local rCard = z(new("Frame", { BackgroundColor3 = Color3.fromRGB(236, 237, 240), BorderSizePixel = 0, Position = UDim2.fromOffset(18, 6), Size = UDim2.new(1, -36, 0, 190) }, pReview))
corner(rCard, UDim.new(0, 14))
local rTo = z(label(rCard, "", 17, false, C.text, UDim2.fromOffset(16, 14), UDim2.new(1, -32, 0, 24)))
local rAmt = z(label(rCard, "", 17, false, C.text, UDim2.fromOffset(16, 52), UDim2.new(1, -32, 0, 24)))
local rAfter = z(label(rCard, "", 17, false, C.sub, UDim2.fromOffset(16, 90), UDim2.new(1, -32, 0, 24)))
local rSend = z(new("TextButton", { Text = "Send", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, Position = UDim2.fromOffset(18, 214), Size = UDim2.new(1, -36, 0, 50) }, pReview))
corner(rSend, UDim.new(0, 12))
local rCancel = z(new("TextButton", { Text = "Cancel", TextSize = 18, Font = FONT_B, TextColor3 = C.text, BackgroundColor3 = Color3.fromRGB(226, 227, 232), Position = UDim2.fromOffset(18, 274), Size = UDim2.new(1, -36, 0, 50) }, pReview))
corner(rCancel, UDim.new(0, 12))

-- 4) enviado
local pSent = sPage("sent")
local ck = z(new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 50), Size = UDim2.fromOffset(64, 64) }, pSent)); corner(ck); new("UIStroke", { Color = Color3.fromRGB(74, 77, 90), Thickness = 3 }, ck)
z(label(ck, "\u{2713}", 34, true, Color3.fromRGB(74, 77, 90), nil, UDim2.fromScale(1, 1), Enum.TextXAlignment.Center))
z(label(pSent, "Robux sent", 22, true, C.text, UDim2.fromOffset(0, 134), UDim2.new(1, 0, 0, 30), Enum.TextXAlignment.Center))
local sentMsg = z(label(pSent, "", 16, false, C.sub, UDim2.fromOffset(0, 168), UDim2.new(1, 0, 0, 24), Enum.TextXAlignment.Center))
local sDone = z(new("TextButton", { Text = "Done", TextSize = 18, Font = FONT_B, TextColor3 = Color3.new(1, 1, 1), BackgroundColor3 = C.blue, Position = UDim2.fromOffset(18, 224), Size = UDim2.new(1, -36, 0, 50) }, pSent))
corner(sDone, UDim.new(0, 12))

local function refreshBalances()
	for _, l in ipairs(balanceLabels) do l.Text = tostring(simBalance) end
	aAvail.Text = "Available: " .. simBalance
end
refreshBalances()
goAmount = function(u)
	target = u
	aAv.Image = avatarOf(u.Id); aName.Text = (u.DisplayName ~= "" and u.DisplayName or u.Username); aUser.Text = "@" .. u.Username
	aBox.Text = ""
	aNext.BackgroundColor3 = Color3.fromRGB(190, 200, 235)
	sShow("amount")
end
aNext.Activated:Connect(function()
	if not validAmount() then return end
	amount = tonumber(aBox.Text)
	rTo.Text = "To: @" .. target.Username
	rAmt.Text = "Amount: " .. amount
	rAfter.Text = "Balance after: " .. (simBalance - amount)
	sShow("review")
end)
rCancel.Activated:Connect(function() sShow("amount") end)
rSend.Activated:Connect(function()
	simBalance -= amount
	refreshBalances()
	sentMsg.Text = "You sent " .. amount .. " to @" .. target.Username .. "."
	sShow("sent")
end)
local function closeSend()
	TweenService:Create(sDim, TweenInfo.new(0.2), { BackgroundTransparency = 1 }):Play()
	local tw = TweenService:Create(sSheet, TweenInfo.new(0.22, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = UDim2.new(0, 0, 1, 0) + UDim2.fromScale(0, 1) })
	tw:Play()
	tw.Completed:Once(function() sendGui.Visible = false end)
end
sClose.Activated:Connect(closeSend)
sDone.Activated:Connect(closeSend)
sDim.Activated:Connect(closeSend)
openSendSheet = function()
	sBox.Text = ""
	sShow("search")
	loadFriends()
	sendGui.Visible = true
	sDim.BackgroundTransparency = 1
	sSheet.Position = UDim2.new(0, 0, 1.2, 0)
	TweenService:Create(sDim, TweenInfo.new(0.2), { BackgroundTransparency = 0.5 }):Play()
	TweenService:Create(sSheet, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = UDim2.new(0, 0, 1, 0) }):Play()
end


-- ======== Pantalla Robux (solo saldo de juguete y Send; sin paquetes ni compras) ========
local rbxPage = new("Frame", { Name = "RobuxPage", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(247, 247, 248), BorderSizePixel = 0, Visible = false, ZIndex = 70 }, root)
local rbxTop = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 74), ZIndex = 71 }, rbxPage)
local rbxX = new("TextButton", { Text = "\u{2715}", TextSize = 18, Font = FONT, TextColor3 = C.text, BackgroundColor3 = Color3.fromRGB(231, 232, 236), AutoButtonColor = true, Position = UDim2.fromOffset(18, 34), Size = UDim2.fromOffset(34, 34), ZIndex = 72 }, rbxTop)
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
local ft = label(rbxBody, "FAQ", 22, true, C.text, nil, UDim2.new(1, 0, 0, 30))
ft.ZIndex = 71
ft.LayoutOrder = 1
for i, q in ipairs({ "What are Robux?", "How do I send Robux?", "Where can I use Robux?" }) do
	local card = new("Frame", { BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 50), LayoutOrder = 1 + i, ZIndex = 71 }, rbxBody)
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
local pn = label(prof, player.DisplayName, 22, true, C.text, UDim2.fromOffset(74, 8), UDim2.new(1, -74, 0, 28)); pn.ZIndex = 51
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
for _, it in ipairs({ { "Favorites", nil, "favorites" }, { "Continue Playing", nil, "continue" }, { "Friends", nil, "friends" }, { "Communities", nil, "communities" }, { "Inventory", nil, "inventory" }, { "Trades", nil, "trades" }, { "Messages", 4, "messages" }, { "Roblox Plus", nil, "plus" }, { "Settings", 1, "settings" }, { "Help & Safety", nil, "help" } }) do row(it[1], it[2], it[3]) end
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
