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
		pg.Visible = (currentNav == "Home" and n == currentTab) or (currentNav == "Me" and n == "Me")
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

-- ---- Me: avatar real (3D) + catalogo real ----
local mePage = page("Me")
local viewBox = new("Frame", { BackgroundColor3 = C.gray, Size = UDim2.new(1, 0, 0, 320), LayoutOrder = 1 }, mePage)
corner(viewBox, UDim.new(0, 14))
local vp = new("ViewportFrame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Ambient = Color3.fromRGB(190, 190, 190), LightColor = Color3.fromRGB(255, 255, 255) }, viewBox)
local world = new("WorldModel", {}, vp)
local cam = new("Camera", { FieldOfView = 40 }, vp)
vp.CurrentCamera = cam
local rig, yaw, desc = nil, 0, nil
local function placeCamera()
	if not rig then return end
	local rootPart = rig:FindFirstChild("HumanoidRootPart")
	if not rootPart then return end
	local pos = rootPart.Position + Vector3.new(0, 0.6, 0)
	local dir = CFrame.Angles(0, math.rad(yaw), 0) * Vector3.new(0, 0, 8.5)
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
local function loadMyDescription()
	task.spawn(function()
		local ok, d = pcall(function() return Players:GetHumanoidDescriptionFromUserId(player.UserId) end)
		if ok and d then desc = d; buildRig() end
	end)
end
loadMyDescription()
-- girar arrastrando
local dragging, lastX = false, 0
viewBox.InputBegan:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = true; lastX = i.Position.X end
end)
viewBox.InputEnded:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = false end
end)
viewBox.InputChanged:Connect(function(i)
	if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
		yaw = yaw - (i.Position.X - lastX) * 0.8
		lastX = i.Position.X
		placeCamera()
	end
end)

-- categorias
local CATS = {
	{ "Hats", Enum.AvatarAssetType.Hat, "Hat" },
	{ "Hair", Enum.AvatarAssetType.HairAccessory, "Hair" },
	{ "Face", Enum.AvatarAssetType.FaceAccessory, "Face" },
	{ "Shirts", Enum.AvatarAssetType.Shirt, "Shirt" },
	{ "Pants", Enum.AvatarAssetType.Pants, "Pants" },
	{ "T-Shirts", Enum.AvatarAssetType.TShirt, "TShirt" },
}
local catRow = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, Size = UDim2.new(1, 0, 0, 40), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, ScrollingDirection = Enum.ScrollingDirection.X, LayoutOrder = 2 }, mePage)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), VerticalAlignment = Enum.VerticalAlignment.Center }, catRow)
local grid = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = 3 }, mePage)
new("UIGridLayout", { CellSize = UDim2.new(0.333, -8, 0, 150), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
local status = label(mePage, "", 14, false, C.sub, nil, UDim2.new(1, 0, 0, 20))
status.LayoutOrder = 4

local function wear(assetId, kind)
	if not desc then return end
	if kind == "Shirt" then
		desc.Shirt = assetId
	elseif kind == "Pants" then
		desc.Pants = assetId
	elseif kind == "TShirt" then
		desc.GraphicTShirt = assetId
	else
		local t = Enum.AccessoryType.Face
		if kind == "Hat" then t = Enum.AccessoryType.Hat elseif kind == "Hair" then t = Enum.AccessoryType.Hair end
		local acc = desc:GetAccessories(true)
		table.insert(acc, { AssetId = assetId, AccessoryType = t, IsLayered = false, Order = #acc + 1 })
		desc:SetAccessories(acc, true)
	end
	buildRig()
end

local searchToken = 0
local function loadCategory(cat)
	searchToken += 1
	local my = searchToken
	for _, c in ipairs(grid:GetChildren()) do
		if c:IsA("GuiObject") then c:Destroy() end
	end
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
		for i, it in ipairs(items) do
			if i > 18 then break end
			local cell = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.gray, LayoutOrder = i }, grid)
			corner(cell, UDim.new(0, 10))
			new("ImageLabel", { BackgroundTransparency = 1, Image = "rbxthumb://type=Asset&id=" .. it.Id .. "&w=150&h=150", Position = UDim2.fromOffset(6, 6), Size = UDim2.new(1, -12, 1, -42), ScaleType = Enum.ScaleType.Fit }, cell)
			local nm = label(cell, it.Name or "", 13, true, C.text, UDim2.new(0, 6, 1, -34), UDim2.new(1, -12, 0, 30))
			nm.TextWrapped = true
			nm.TextYAlignment = Enum.TextYAlignment.Top
			nm.TextTruncate = Enum.TextTruncate.AtEnd
			cell.Activated:Connect(function() wear(it.Id, cat[3]) end)
		end
	end)
	if not ok then
		status.Text = "Catalog unavailable (enable Studio access to API services in Game Settings > Security)."
		warn(err)
	end
end
local catBtns = {}
for i, cat in ipairs(CATS) do
	local b = new("TextButton", { Text = cat[1], TextSize = 15, Font = FONT_B, TextColor3 = C.text, BackgroundColor3 = C.gray, AutoButtonColor = true, Size = UDim2.fromOffset(86, 34) }, catRow)
	corner(b)
	catBtns[i] = b
	b.Activated:Connect(function()
		for j, bb in ipairs(catBtns) do
			bb.BackgroundColor3 = (j == i) and C.text or C.gray
			bb.TextColor3 = (j == i) and C.bg or C.text
		end
		loadCategory(cat)
	end)
end
local reset = new("TextButton", { Text = "Reset", TextSize = 15, Font = FONT_B, TextColor3 = C.blue, BackgroundColor3 = C.gray, Size = UDim2.fromOffset(70, 34) }, catRow)
corner(reset)
reset.Activated:Connect(loadMyDescription)
task.defer(function() loadCategory(CATS[1]) end)

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
	content.Visible = (name == "Home" or name == "Me")
	header.Visible = (name == "Home"); tabsBar.Visible = (name == "Home")
	content.Position = (name == "Home") and UDim2.fromOffset(0, 100) or UDim2.fromOffset(0, 0)
	content.Size = (name == "Home") and UDim2.new(1, 0, 1, -164) or UDim2.new(1, 0, 1, -64)
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
