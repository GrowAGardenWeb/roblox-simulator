--[[
  SIN MOVIMIENTO - parte del SERVIDOR (Script).
  Pon este script en: ServerScriptService, como "Script" (NO LocalScript).
  Le dice a Roblox que este juego maneja el movimiento por su cuenta (Scriptable),
  asi que NO crea el joystick ni el boton de saltar en el celular.
]]
local Players = game:GetService("Players")

local function setup(player)
	pcall(function() player.DevTouchMovementMode = Enum.DevTouchMovementMode.Scriptable end)
	pcall(function() player.DevComputerMovementMode = Enum.DevComputerMovementMode.Scriptable end)
	local function freeze(char)
		local hum = char:WaitForChild("Humanoid", 10)
		if hum then
			hum.WalkSpeed = 0
			hum.UseJumpPower = true
			hum.JumpPower = 0
			hum.JumpHeight = 0
		end
	end
	if player.Character then task.spawn(freeze, player.Character) end
	player.CharacterAdded:Connect(function(char) task.spawn(freeze, char) end)
end

Players.PlayerAdded:Connect(setup)
for _, p in ipairs(Players:GetPlayers()) do setup(p) end
