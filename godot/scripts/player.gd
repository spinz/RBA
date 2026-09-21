extends CharacterBody2D

class_name Player

# Movement settings
@export var speed: float = 175.0
@export var acceleration: float = 1000.0
@export var friction: float = 1400.0
@export var air_friction: float = 250.0

# Jump settings
@export var jump_velocity: float = -340.0
@export var min_jump_velocity: float = -150.0
@export var coyote_time: float = 0.12
@export var jump_buffer_time: float = 0.12

# Timers & state
var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity", 980.0)
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var anim_timer: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

func _ready() -> void:
	_setup_default_inputs()

func _physics_process(delta: float) -> void:
	# 1. Timers
	if is_on_floor():
		coyote_timer = coyote_time
	else:
		coyote_timer = max(0.0, coyote_timer - delta)

	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = jump_buffer_time
	else:
		jump_buffer_timer = max(0.0, jump_buffer_timer - delta)

	# 2. Gravity
	if not is_on_floor():
		velocity.y += gravity * delta

	# 3. Jump execution
	if jump_buffer_timer > 0.0 and coyote_timer > 0.0:
		velocity.y = jump_velocity
		jump_buffer_timer = 0.0
		coyote_timer = 0.0
		# Visual stretch
		if sprite:
			sprite.scale = Vector2(0.85, 1.25)

	# 4. Variable Jump Cut
	if Input.is_action_just_released("jump") and velocity.y < min_jump_velocity:
		velocity.y = min_jump_velocity

	# 5. Horizontal Run & Snappy Deceleration
	var direction := Input.get_axis("move_left", "move_right")
	if direction != 0.0:
		velocity.x = move_toward(velocity.x, direction * speed, acceleration * delta)
		if sprite:
			sprite.flip_h = direction < 0
	else:
		var current_friction = friction if is_on_floor() else air_friction
		velocity.x = move_toward(velocity.x, 0.0, current_friction * delta)

	move_and_slide()
	_update_visuals(delta, direction)

func _update_visuals(delta: float, direction: float) -> void:
	if not sprite:
		return

	# Smoothly return scale to normal (squash & stretch recovery)
	sprite.scale = sprite.scale.lerp(Vector2.ONE, delta * 12.0)

	if not is_on_floor():
		# Air frames: Jump vs Fall
		if velocity.y < 0:
			sprite.frame = 2 # Jump frame
		else:
			sprite.frame = 3 # Fall frame
	else:
		if abs(velocity.x) > 10.0:
			# Hop run cycle
			anim_timer += delta * 10.0
			sprite.frame = 0 if int(anim_timer) % 2 == 0 else 2
		else:
			# Idle cycle (slow throat puff breathing)
			anim_timer += delta * 2.0
			sprite.frame = 1 if (int(anim_timer) % 4 == 0) else 0

func _setup_default_inputs() -> void:
	# Fallback bindings if not configured in ProjectSettings
	_bind_action("move_left", [KEY_A, KEY_LEFT])
	_bind_action("move_right", [KEY_D, KEY_RIGHT])
	_bind_action("jump", [KEY_SPACE, KEY_W, KEY_UP])
	_bind_action("attack", [KEY_J, KEY_X, KEY_ENTER])

func _bind_action(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
		for k in keys:
			var event = InputEventKey.new()
			event.physical_keycode = k
			InputMap.action_add_event(action, event)
