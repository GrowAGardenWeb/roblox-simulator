--[[
  SERVIDOR del avatar (poner en: ServerScriptService > Script, de tipo "Script", NO LocalScript).
  El cliente le manda como esta vestido el avatar y el servidor construye el modelo 3D.
  En el servidor Roblox si carga items del catalogo que no son tuyos (en el cliente los bloquea).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")
local InsertService = game:GetService("InsertService")

local remote = Instance.new("RemoteFunction")
remote.Name = "AvatarPreview"
remote.Parent = ReplicatedStorage

local folder = workspace:FindFirstChild("AvatarPreviews") or Instance.new("Folder")
folder.Name = "AvatarPreviews"
folder.Parent = workspace

local function build(player, data)
	if typeof(data) ~= "table" then return nil end
	-- base: tu avatar real; encima se aplica lo que el cliente pide
	local ok, base = pcall(function() return Players:GetHumanoidDescriptionFromUserId(player.UserId) end)
	local desc = (ok and base) or Instance.new("HumanoidDescription")

	local list = {}
	for _, a in ipairs(data.acc or {}) do
		local okT, t = pcall(function() return Enum.AccessoryType[a.AccessoryType] end)
		if okT and t and tonumber(a.AssetId) then
			local layered = a.IsLayered and true or false
			local entry = { AssetId = tonumber(a.AssetId), AccessoryType = t, IsLayered = layered, Puffiness = a.Puffiness }
			if layered then entry.Order = tonumber(a.Order) or (#list + 1) end
			list[#list + 1] = entry
		end
	end
	pcall(function() desc:SetAccessories(list, true) end)

	for _, k in ipairs({ "Shirt", "Pants", "GraphicTShirt" }) do
		if tonumber(data[k]) then desc[k] = tonumber(data[k]) end
	end
	for _, k in ipairs({ "HeadColor", "TorsoColor", "LeftArmColor", "RightArmColor", "LeftLegColor", "RightLegColor" }) do
		if typeof(data[k]) == "Color3" then desc[k] = data[k] end
	end
	for _, k in ipairs({ "HeightScale", "WidthScale", "DepthScale", "HeadScale", "ProportionScale", "BodyTypeScale" }) do
		if tonumber(data[k]) then desc[k] = tonumber(data[k]) end
	end

	local okM, model = pcall(function() return Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R15) end)
	if not okM or not model then
		warn("AvatarPreview: no se pudo construir el modelo: " .. tostring(model))
		return nil
	end
	-- ITEMS DE PRUEBA (los que no son tuyos): se cargan con InsertService y se ponen con AddAccessory
	local hum = model:FindFirstChildOfClass("Humanoid")
	local report = {}
	for _, e in ipairs(data.extra or {}) do
		local id = tonumber(e.AssetId)
		if id and hum then
			local okL, loaded = pcall(function() return InsertService:LoadAsset(id) end)
			if okL and loaded then
				local acc = loaded:FindFirstChildWhichIsA("Accessory", true)
				if acc and model:FindFirstChild(acc.Name) then acc = nil; loaded:Destroy(); loaded = Instance.new("Folder") end
				local shirt = loaded:FindFirstChildWhichIsA("Shirt", true)
				local pants = loaded:FindFirstChildWhichIsA("Pants", true)
				local tee = loaded:FindFirstChildWhichIsA("ShirtGraphic", true)
				if acc then
					acc.Parent = nil
					hum:AddAccessory(acc)
				elseif shirt then
					local old = model:FindFirstChildOfClass("Shirt"); if old then old:Destroy() end
					shirt.Parent = model
				elseif pants then
					local old = model:FindFirstChildOfClass("Pants"); if old then old:Destroy() end
					pants.Parent = model
				elseif tee then
					local old = model:FindFirstChildOfClass("ShirtGraphic"); if old then old:Destroy() end
					tee.Parent = model
				else
					report[#report + 1] = id .. ": ya cargado o sin accesorio"
				end
				loaded:Destroy()
			else
				warn("AvatarPreview: LoadAsset fallo para " .. tostring(id) .. ": " .. tostring(loaded))
				report[#report + 1] = id .. ": " .. tostring(loaded):sub(1, 90)
			end
		end
	end
	model:SetAttribute("Report", table.concat(report, " | "))
	model.Name = "Preview_" .. player.UserId
	local root = model:FindFirstChild("HumanoidRootPart")
	if root then root.Anchored = true end
	model:PivotTo(CFrame.new(0, -500, 0))
	model.Parent = folder
	task.wait(0.6) -- deja que se replique al cliente
	Debris:AddItem(model, 8)
	return model
end

remote.OnServerInvoke = build
