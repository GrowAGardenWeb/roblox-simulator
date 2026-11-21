--[[
  SERVIDOR del avatar (poner en: ServerScriptService > Script, de tipo "Script", NO LocalScript).
  El cliente le manda como esta vestido el avatar y el servidor construye el modelo 3D.
  En el servidor Roblox si carga items del catalogo que no son tuyos (en el cliente los bloquea).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local remote = Instance.new("RemoteFunction")
remote.Name = "AvatarPreview"
remote.Parent = ReplicatedStorage

local folder = workspace:FindFirstChild("AvatarPreviews") or Instance.new("Folder")
folder.Name = "AvatarPreviews"
folder.Parent = workspace

local busy = {}

local function build(player, data)
	if typeof(data) ~= "table" then return nil end
	if busy[player] then return nil end
	busy[player] = true

	-- base: tu avatar real; encima se aplica lo que el cliente pide
	local ok, base = pcall(function() return Players:GetHumanoidDescriptionFromUserId(player.UserId) end)
	local desc = (ok and base) or Instance.new("HumanoidDescription")

	local list = {}
	for _, a in ipairs(data.acc or {}) do
		local okT, t = pcall(function() return Enum.AccessoryType[a.AccessoryType] end)
		if okT and t and tonumber(a.AssetId) then
			list[#list + 1] = { AssetId = tonumber(a.AssetId), AccessoryType = t, IsLayered = a.IsLayered and true or false, Order = tonumber(a.Order) or (#list + 1), Puffiness = a.Puffiness }
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
	busy[player] = nil
	if not okM or not model then
		warn("AvatarPreview: no se pudo construir el modelo: " .. tostring(model))
		return nil
	end
	model.Name = "Preview_" .. player.UserId
	local root = model:FindFirstChild("HumanoidRootPart")
	if root then root.Anchored = true end
	model:PivotTo(CFrame.new(0, -500, 0))
	model.Parent = folder
	task.wait(0.35) -- deja que se replique al cliente
	Debris:AddItem(model, 8)
	return model
end

remote.OnServerInvoke = build
Players.PlayerRemoving:Connect(function(p) busy[p] = nil end)
