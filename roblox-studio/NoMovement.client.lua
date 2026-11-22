--[[
  SIN MOVIMIENTO (LocalScript).
  Pon este script en: StarterPlayer > StarterPlayerScripts, como "LocalScript" (NO Script).
  Apaga el joystick, el boton de saltar y el teclado, y deja el personaje quieto.
]]
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- 1) apaga los controles de Roblox (joystick, boton de saltar, teclado)
task.spawn(function()
	local okC, controls = pcall(function()
		return require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule", 10)):GetControls()
	end)
	if okC and controls then pcall(function() controls:Disable() end) end
end)

-- 2) por si acaso, el personaje no camina ni salta (se repite cada vez que reaparece)
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
