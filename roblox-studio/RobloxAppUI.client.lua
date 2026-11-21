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

-- ======== ScreenGui ========
local gui = new("ScreenGui", { Name = "RobloxAppUI", ResetOnSpawn = false, IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling }, player:WaitForChild("PlayerGui"))
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
	for _, r in ipairs({ 0, 45 }) do
		local f = new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(18, 18), Rotation = r }, h)
		new("UICorner", { CornerRadius = UDim.new(0.25, 0) }, f); new("UIStroke", { Color = C.text, Thickness = 2 }, f)
	end
	local inner = new("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(8, 8) }, h)
	new("UIStroke", { Color = C.text, Thickness = 2 }, inner)
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
local av = new("Frame", { BackgroundColor3 = C.gray, Size = UDim2.fromOffset(52, 52) }, userRow); corner(av)
new("UIStroke", { Color = C.line, Thickness = 1 }, av)
local head = new("Frame", { BackgroundColor3 = Color3.fromRGB(245, 205, 160), Position = UDim2.fromOffset(14, 14), Size = UDim2.fromOffset(24, 26) }, av); corner(head, UDim.new(0.4, 0))
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
local top = section(charts, "Top Trending", 1); tilesRow(top, 6, 150, 150, 1)
local pop = section(charts, "Most Engaging", 2); tilesRow(pop, 6, 150, 150, 2)
local up = section(charts, "Up-and-Coming", 3); tilesRow(up, 6, 150, 150, 3)

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
		TweenService:Create(segSel, TweenInfo.new(0.18, Enum.EasingStyle.Quad), { Position = UDim2.fromOffset(i == 1 and 4 or 70, 3), Size = UDim2.fromOffset(i == 1 and 76 or 76, 28) }):Play()
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
	else
		local t = Enum.AccessoryType.Face
		if kind == "Hat" then t = Enum.AccessoryType.Hat elseif kind == "Hair" then t = Enum.AccessoryType.Hair end
		local acc = desc:GetAccessories(true)
		table.insert(acc, { AssetId = assetId, AccessoryType = t, IsLayered = false, Order = #acc + 1 })
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
local function row(text, badge, key)
	local r = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 41), LayoutOrder = nextOrd(), ZIndex = 51 }, dScroll)
	local ic = new("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(2, 9), Size = UDim2.fromOffset(22, 22), ZIndex = 51 }, r)
	if key and (DICONS[key] or "") ~= "" then
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

-- ======== Barra inferior ========
local nav = new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 64), BackgroundColor3 = C.bg, BorderSizePixel = 0 }, root)
new("Frame", { BackgroundColor3 = C.line, BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 1) }, nav)
local items = { { "Home", "home" }, { "Moments", "moments" }, { "Chat", "chat" }, { "Me", "me" } }
local navLabels, navIcons = {}, {}
local function selectNav(name)
	currentNav = name
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
			local c = new("Frame", { BackgroundColor3 = C.gray, Size = UDim2.fromScale(1, 1) }, h); corner(c)
			local hd = new("Frame", { BackgroundColor3 = Color3.fromRGB(245, 205, 160), Position = UDim2.fromOffset(8, 7), Size = UDim2.fromOffset(12, 13) }, c); corner(hd, UDim.new(0.4, 0))
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
