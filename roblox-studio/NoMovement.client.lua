--[[
  SIN MOVIMIENTO - parte del CLIENTE (LocalScript).
  Pon este script en: StarterPlayer > StarterPlayerScripts, como "LocalScript" (NO Script).
  Va junto con NoMovement.server.lua (ese va en ServerScriptService).
  Esconde el joystick y el boton de saltar y apaga los controles; lo repite cada vez que el personaje reaparece.
]]
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- 1) apaga los controles de Roblox
local controls
task.spawn(function()
	local ok, c = pcall(function()
		return require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule", 15)):GetControls()
	end)
	if ok and c then
		controls = c
		pcall(function() controls:Disable() end)
	end
end)
-- Roblox vuelve a activarlos al reaparecer: se apagan otra vez
player.CharacterAdded:Connect(function()
	for _ = 1, 10 do
		task.wait(0.3)
		if controls then pcall(function() controls:Disable() end) end
	end
end)

-- 2) esconde la pantalla del joystick y del boton de saltar (TouchGui), aunque Roblox la vuelva a crear
local function hideTouch(gui)
	if gui.Name == "TouchGui" and gui:IsA("ScreenGui") then
		gui.Enabled = false
		gui:GetPropertyChangedSignal("Enabled"):Connect(function()
			if gui.Enabled then gui.Enabled = false end
		end)
	end
end
local pg = player:WaitForChild("PlayerGui")
for _, g in ipairs(pg:GetChildren()) do hideTouch(g) end
pg.ChildAdded:Connect(hideTouch)

-- 3) el personaje no camina ni salta
local function freezeCharacter(char)
	local hum = char:WaitForChild("Humanoid", 10)
	if hum then
		hum.WalkSpeed = 0
		hum.UseJumpPower = true
		hum.JumpPower = 0
		hum.JumpHeight = 0
	end
end
if player.Character then task.spawn(freezeCharacter, player.Character) end
player.CharacterAdded:Connect(function(char) task.spawn(freezeCharacter, char) end)
