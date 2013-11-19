//Removes leading whitespace from input
function leadingTrim(input)
{
	if (input)
	{
		var reg = /\s*((\S+\s*)*/;
		return input.replace(reg, '$1');
	}
	return ''; //No input
}

//Removes trailing whitespace from input
function trailingTrim(input)
{
	if (value)
	{
		var reg = /((\s*\S+)*)\s*/;
		return value.replace(re, '$1');
	}
	return ''; //No input
}

//Compounds upper two functions
function trim(input)
{
	if (input)
	{
		return trailingTrim(leadingTrim(input));
	}
	return ''; //No input
}

//I think this sanitizes input
function entityEncode(str)
{
	str = str.replace(/&/g, '&amp;');
	str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');
	str = str.replace(/ /g, ' &nbsp;');
	if (/msie/i.test(navigator.userAgent))
	{
		str = str.replace('\n', '&nbsp;<br />');
	}
	else
	{
		str = str.replace(/\x0D/g, '&nbsp;<br />');
	}
	return str;
}

var TerminalShell = 
{
	commands: 
	{
		help: function help(terminal)
		{
			terminal.print($('Please view Help tab to the right'));
		},
		clear: function(terminal)
		{
			terminal.clear();
		}
	},
	filters: [],
	fallback: null,
	
	lastCommand: null,
	
	//Process commands inputted
	process: function(terminal, cmd)
	{
		try
		{
			$.each(this.filters, $.proxy(function(index, filter)
			{
				cmd = filter.call(this, terminal, cmd);
			}, this));
			var cmd_args = cmd.split(' ');
			var cmd_name = cmd_args.shift();
			cmd_args.unshift(terminal);
			if (this.commands.hasOwnProperty(cmd_name))
			{
				this.commands[cmd_name].apply(this, cmd_args);
			}
			else
			{
				if (!(this.fallback && this.fallback(terminal, cmd)))
				{
					terminal.print('What?');
				}
				else
				{
					terminal.print('Other stuff here.');
				}
			}
			this.lastCommand = cmd;
		}
		catch (e)
		{
			terminal.print($('<p>').addClass('error').text('Uh oh: ' + e));
			terminal.setWorking(false);
		}
	}
};

var Terminal =
{
	buffer: '',
	pos: 0,
	history: [],
	historyPos: 0,
	promptActive: true,
	cursorBlinkState: true,
	_cursorBlinkTimeout: null,
	spinnerIndex: 0,
	_spinnerTimeout: null,
	
	output: TerminalShell,
	
	config:
	{
		scrollStep:10,
		scrollSpeed:100,
		bg_color:'#000',
		fg_color:'#FFF',
		cursor_blink_time:700,
		cursor_style:'block',
		prompt:'> This doesn\'t work right now.',
		spinnerCharacters:[' ','.','..','...',' ..','  .'],
		spinnerSpeed:850,
		typingSpeed:50
	},
	
	init: function()
	{
		function ifActive(func)
		{
			return function()
			{
				if (TerminalShell.promptActive)
				{
					func.apply(this, arguments);
				}
			};
		}
		
		$(document)
			.keyup($.proxy(ifActive(function(e)
			{
				if (e.which >= 32 && e.which <= 126)
				{
					var character = String.fromCharCode(e.which);
				} 
				else 
				{
					return;
				}
			
				if (character)
				{
					this.addCharacter(character);
				}
			}), this))
			.bind('keyup', 'return', ifActive(function(e) { Terminal.processInputBuffer(); }))
			.bind('keyup', 'backspace', ifActive(function(e) { e.preventDefault(); Terminal.deleteCharacter(e.shiftKey); }))
			.bind('keyup', 'del', ifActive(function(e) { Terminal.deleteCharacter(true); }))
			.bind('keyup', 'left', ifActive(function(e) { Terminal.moveCursor(-1); }))
			.bind('keyup', 'right', ifActive(function(e) { Terminal.moveCursor(1); }))
			.bind('keyup', 'home', ifActive(function(e) { e.preventDefault(); Terminal.setPos(0); }))
			.bind('keyup', 'end', ifActive(function(e) { e.preventDefault(); Terminal.setPos(Terminal.buffer.length); }))
	
		this.setCursorState(true);
		this.setWorking(true);
		$('#prompt').html(this.config.prompt);
		$('#game').hide().fadeIn('fast', function()
		{
			$('#screen').triggerHandler('cli-load');
		});
	},
	
	//Toggle blinky light thing
	setCursorState: function(state, fromTimeout)
	{
		this.cursorBlinkState = state;
		if (this.config.cursor_style == 'block')
		{
			if (state)
			{
				$('#cursor').css({color:this.config.bg_color, backgroundColor:this.config.fg_color});
			}
			else
			{
				$('#cursor').css({color:this.config.fg_color, background:'none'});
			}
		}
		else
		{
			if (state)
			{
				$('#cursor').css('textDecoration', 'underline');
			}
			else
			{
				$('#cursor').css('textDecoration', 'none');
			}
		}
		
		if (!fromTimeout && this._cursorBlinkTimeout)
		{
			window.clearTimeout(this._cursorBlinkTimeout);
			this._cursorBlinkTimeout = null;
		}
		this._cursorBlinkTimeout = window.setTimeout($.proxy(function()
		{
			this.setCursorState(!this.cursorBlinkState, true);
		}, this), this.config.cursor_blink_time);
	},
	
	//Updates prompt display
	updateInputDisplay: function()
	{
		var left = '', underCursor = ' ', right = '';
		
		if (this.pos < 0)
		{
			this.pos = 0;
		}
		if (this.pos > this.buffer.length)
		{
			this.pos = this.buffer.length;
		}
		if (this.pos > 0)
		{
			left = this.buffer.substr(0, this.pos);
		}
		if (this.pos < this.buffer.length)
		{
			underCursor = this.buffer.substr(this.pos, 1);
		}
		if (this.buffer.length - this.pos > 1)
		{
			right = this.buffer.substr(this.pos+1, this.buffer.length-this.pos-1);
		}
		$('#lcommand').text(left);
		$('#cursor').text(underCursor);
		if (underCursor == ' ')
		{
			$('#cursor').html('&nbsp;');
		}
		$('#rcommand').text(right);
		$('#prompt').text(this.config.prompt);
		return;
	},
	
	//Clear input on enter
	clearInputBuffer: function()
	{
		this.buffer = '';
		this.pos = 0;
		this.updateInputDisplay();
	},
	clear: function()
	{
		$('#display').html('');
	},
	
	//Add character to buffer at buffer pos
	addCharacter: function(character)
	{
		var left = this.buffer.substr(0, this.pos);
		var right = this.buffer.substr(this.pos, this.buffer.length - this.pos);
		this.buffer = left + character + right;
		this.pos++;
		this.updateInputDisplay();
		this.setCursorState(true);
	},
	
	//Remove character and shift buffer
	deleteCharacter: function(forward)
	{
		var offset = forward ? 1 : 0;
		if (this.pos >= (1-offset))
		{
			var left = this.buffer.substr(0, this.pos-1+offset);
			var right = this.buffer.substr(this.pos+offset, this.buffer.length-this.pos-offset);
			this.buffer = left + right;
			this.pos -= 1-offset;
			this.updateInputDisplay();
		}
		this.setCursorState(true);
	},
	
	deleteWord: function() 
	{
		if (this.pos > 0) 
		{
			var ncp = this.pos;
			while (ncp > 0 && this.buffer.charAt(ncp) !== ' ') 
			{
				ncp--;
            }
            left = this.buffer.substr(0, ncp - 1);
            right = this.buffer.substr(ncp, this.buffer.length - this.pos);
            this.buffer = left + right;
            this.pos = ncp;
            this.updateInputDisplay();
        }
        this.setCursorState(true);
    },
	
	//Move character over val
	moveCursor: function(val)
	{
		this.setPos(this.pos+val);
	},
	
	//Like moveCursor, but manual placement
	setPos: function(pos)
	{
		if ((pos >= 0) && (pos <= this.buffer.length))
		{
			this.pos = pos;
			Terminal.updateInputDisplay();
		}
		this.setCursorState(true);
	},
	
	print: function(text)
	{
		if (!text)
		{
			$('#display').append($('<div>'));
		}
		else if (text instanceof jQuery)
		{
			$('#display').append(text);
		}
		else
		{
			var av = Array.prototype.slice.call(arguments, 0);
			$('#display').append($('<p>').text(av.join(' ')));
		}
		this.jumpToBottom();
	},
	
	processInputBuffer: function(cmd)
	{
		this.print($('<p>').addClass('command').text(this.config.prompt+this.buffer));
		var cmd = trim(this.buffer);
		this.clearInputBuffer();
		if (cmd.length == 0)
		{
			return false;
		}
		if (this.output)
		{
			return this.output.process(this, cmd);
		}
		else
		{
			return false;
		}
	},
	
	setPromptActive: function(active)
	{
		this.promptActive = active;
		$('#inputline').toggle(this.promptActive);
	},
	
	//Hint: It's always false.
	setWorking: function(working)
	{
		if (working && !this._spinnerTimeout)
		{
			$('#display .command:last-child').add('#bottomline').first().append($('#spinner'));
			this._spinnerTimeout = window.setInterval($.proxy(function() {
				if (!$('#spinner').is(':visible'))
				{
					$('#spinner').fadeIn();
				}
				this.spinnerIndex = (this.spinnerIndex+1)%this.config.spinnerCharacters.length;
				$('#spinner').text(this.config.spinnerCharacters[this.spinnerIndex]);
			},this), this.config.spinnerSpeed);
			this.setPromptActive(false);
			$('#game').triggerHandler('cli-busy');
		}
		else if (!working && this._spinnerTimeout)
		{
			clearInterval(this._spinnerTimeout);
			this._spinnerTimout = null;
			$('#spinner').fadeOut();
			this.setPromptActive(true);
			$('#game').triggerHandler('cli-ready');
		}
	},
	
	runCommand: function(text)
	{
		var index = 0;
		var min = false;
		
		this.promptActive = false;
		var interval = window.setInterval($.proxy(function typeCharacter() {
			if (index < text.length)
			{
				this.addCharacter(text.charAt(index));
				index+=1;
			}
			else
			{
				clearInterval(interval);
				this.promptActive = true;
				this.processInputBuffer();
			}
		}, this), this.config.typingSpeed);
	}
};

//Self-explanatory
function getRandomInt(min, max) 
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Return a random element from items array
function randomChoice(items) 
{
	return items[getRandomInt(0, items.length-1)];
}

//Player information -- Save this data, map?
var Player = 
{
	X: 0,
	Y: 0,
	currentHP: 30,
	maxHP: 30,
	damage: 5,
	chance: .01,
	level: 1,
	name: '',
	base: '',
};

//Executed at start
TerminalShell.commands['start'] = function(terminal)
{
	terminal.print('Welcome! What is your name?');
}

//On exit
TerminalShell.commands['exit'] = function(terminal) 
{
	terminal.print('Did you remember to save?');
	$('#prompt, #cursor').hide();
	terminal.promptActive = false;
};

/* FIX PATH REGISTERING
Paths = 
{
	/*Check up on github what the stuff should be
};
Paths['north'] = goDirection('north');
Paths['south'] = goDirection('south');
Paths['east'] = goDirection('east');
Paths['west'] = goDirection("west");
TerminalShell.directions = Paths;*/
//Commands executed when text is input
TerminalShell.commands['go'] = function(terminal) 
{
	//Todo: Check which direction, call goDirection(direction, player)
	terminal.print('You go to the bathroom. Wait - You meant a direction?');
};
function goDirection(direction, player) 
{
	//Monster spawn probability goes here
	if (direction == 'north')
	{
		player.Y -= 1;
		terminal.print('You go north');
	}
	if (direction == 'south')
	{
		player.Y += 1;
		terminal.print('You go south');
	}
	if (direction == 'east')
	{
		player.X += 1;
		terminal.print('You go east');
	}	
	if (direction == 'west')
	{
		player.X -= 1;
		terminal.print('You go west');
	}
}

//Player stats are printed here
TerminalShell.commands['stats'] = function(terminal, player) 
{
	var name_list = $('<ul>');
	name_list.append($('<li>Name - '+player.name+'</li>'));
	name_list.append($('<li>HP   - '+'</li>'));
	name_lsit.append($('<li>(X,Y)- ('+player.X+','+player.Y+')'));
	terminal.print(name_list);
};

//One liners. ha ha ha.
function oneLiner(terminal, msg, msgmap) 
{
	if (msgmap.hasOwnProperty(msg)) {
		terminal.print(msgmap[msg]);
		return true;
	} else {
		return false;
	}
}
TerminalShell.fallback = function(terminal, cmd) 
{
	cmd = cmd.toLowerCase();
	oneliners = 
	{
		'up up down down left right left right b a start': 'What is this? Contra?',
		
	};
	
	if (!oneLiner(terminal, cmd, oneliners)) 
	{
		if (cmd == "aaa") 
		{
			terminal.print(randomChoice([
				'AAA!',
				'Behind you!',
				'What?',
			]));
		} 
		else if (/:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;\s*:/.test(cmd)) 
		{
			Terminal.setWorking(true);
		} 
		else 
		{
			return false;
		}
	}
	return true;
};

/*
Adventure = {
	rooms: {
		0:{description:'You are at a computer using unirpg.', exits:{west:1, south:10}},
		1:{description:'Life is peaceful there.', exits:{east:0, west:2}},
		2:{description:'In the open air.', exits:{east:1, west:3}},
		3:{description:'Where the skies are blue.', exits:{east:2, west:4}},
		4:{description:'This is what we\'re gonna do.', exits:{east:3, west:5}},
		5:{description:'Sun in wintertime.', exits:{east:4, west:6}},
		6:{description:'We will do just fine.', exits:{east:5, west:7}},
		7:{description:'Where the skies are blue.', exits:{east:6, west:8}},
		8:{description:'This is what we\'re gonna do.', exits:{east:7}},
		10:{description:'A dark hallway.', exits:{north:0, south:11}, enter:function(terminal) {
				if (!Adventure.status.lamp) {
					terminal.print('You are eaten by a grue.');
					Adventure.status.alive = false;
					Adventure.goTo(terminal, 666);
				}
			}
		},
		11:{description:'Bed. This is where you sleep.', exits:{north:10}},
		666:{description:'You\'re dead!'}
	},
	
	status: {
		alive: true,
		lamp: false
	},
	
	goTo: function(terminal, id) {
		Adventure.location = Adventure.rooms[id];
		Adventure.look(terminal);
		if (Adventure.location.enter) {
			Adventure.location.enter(terminal);
		}
	}
};
Adventure.location = Adventure.rooms[0];

TerminalShell.commands['look'] = Adventure.look = function(terminal) {
	terminal.print(Adventure.location.description);	
	if (Adventure.location.exits) {
		terminal.print();
		
		var possibleDirections = [];
		$.each(Adventure.location.exits, function(name, id) {
			possibleDirections.push(name);
		});
		terminal.print('Exits: '+possibleDirections.join(', '));
	}
};

TerminalShell.commands['go'] = Adventure.go = function(terminal, direction) {
	if (Adventure.location.exits && direction in Adventure.location.exits) {
		Adventure.goTo(terminal, Adventure.location.exits[direction]);
	} else if (!direction) {
		terminal.print('Go where?');
	} else if (direction == 'down') {
		terminal.print("On our first date?");
	} else {
		terminal.print('You cannot go '+direction+'.');
	}
};

TerminalShell.commands['light'] = function(terminal, what) {
	if (what == "lamp") {
		if (!Adventure.status.lamp) {
			terminal.print('You set your lamp ablaze.');
			Adventure.status.lamp = true;
		} else {
			terminal.print('Your lamp is already lit!');
		}
	} else {
		terminal.print('Light what?');
	}
};

TerminalShell.commands['sleep'] = function(terminal, duration) {
	duration = Number(duration);
	if (!duration) {
		duration = 5;
	}
	terminal.setWorking(true);
	terminal.print("You take a nap.");
	$('#screen').fadeOut(1000);
	window.setTimeout(function() {
		terminal.setWorking(false);
		$('#screen').fadeIn();
		terminal.print("You awake refreshed.");
	}, 1000*duration);
};

TerminalShell.commands['help'] = TerminalShell.commands['halp'] = function(terminal) {
	terminal.print('View the tab on the left for commands');
}; ADVENTURE STUFF*/

//Execute on doc load
$(document).ready(function() 
{
	Terminal.promptActive = true;
	Terminal.init();
	function noData() 
	{
		Terminal.print($('<p>').addClass('error').text('Something brokened :('));
		Terminal.promptActive = true;
	}
	$('#game').bind('cli-load', function(e)
	{
		Terminal.runCommand('start');
	});
});