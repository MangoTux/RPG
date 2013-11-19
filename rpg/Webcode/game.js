
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
			terminal.print($('<h3>help</h3>'));
			cmd_list = $('<ul>');
			$.each(this.commands, function(name, func)
			{
				cmd_list.append($('<li>').text(name));
			});
			terminal.print(cmd_list);
		},
		clear: function(terminal)
		{
			terminal.clear();
		}
	},
	filters: [],
	fallback: null,
	
	lastCommand: null,
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
		scrollStep:20,
		scrollSpeed:100,
		bg_color:'#000',
		fg_color:'#FFF',
		cursor_blink_time:700,
		curson_style:'block',
		prompt:'> ',
		spinnerCharacters:['[   ]','[.  ]','[.. ]','[...]'],
		spinnerSpeed:250,
		typingSpeed:50
	},
	
	init: function()
	{
		function ifActive(func)
		{
			return function()
			{
				if (Terminal.promptActive)
				{
					func.apply(this, arguments);
				}
			};
		}
		
		$(document)
		.keypress($.proxy(ifActive(function(e)
		{
			if (e.which >= 32 && e.which <= 126)
			{
				var character = String.fromCharCode(e.which);
				var letter = character.toLowerCase();
			} 
			else 
			{
				return;
			}
			
			if ($.browser.opera && !(/[\w\s]/.test(character)))
			{
				return;
			}
		}), this))
		.bind('keydown', 'return', ifActive(function(e) { Terminal.processInputBuffer(); }))
		.bind('keydown', 'backspace', ifActive(function(e) { e.preventDefault(); Terminal.deleteCharacter(e.shiftKey); }))
		.bind('keydown', 'del', ifActive(function(e) { Terminal.deleteCharacter(true); }))
		.bind('keydown', 'left', ifActive(function(e) { Terminal.moveCursor(-1); }))
		.bind('keydown', 'right', ifActive(function(e) { Terminal.moveCursor(1); }))
		.bind('keydown', 'home', ifActive(function(e) { e.preventDefault(); Terminal.setPos(0); }))
		.bind('keydown', 'end', ifActive(function(e) { e.preventDefault(); Terminal.setPos(Terminal.buffer.length); }))
	},
	
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
	
	addCharacter: function(character)
	{
		var left = this.buffer.substr(0, this.pos);
		var right = this.buffer.substr(this.pos, this.buffer.length - this.pos);
		this.buffer = left + character + right;
		this.pos++;
		this.updateInputDisplay();
		this.setCursorState(true);
	},
	
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
	
	moveCursor: function(val)
	{
		this.setPos(this.pos+val);
	},
	
	setPos: function(pos)
	{
		if ((pos >= 0) && (pos <= this.buffer.length))
		{
			this.pos = pos;
			Terminal.updateInputDisplay();
		}
		this.setCursorState(true);
	},
	
	jumpToBottom: function()
	{
		$('#screen').animate({scrollTop: $('#screen').attr('scrollHeight')}, this.config.scrollSpeed, 'linear');
	},
	
	print: function(text)
	{
		if (!text)
		{
			$('display').append($('<div>'));
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
			$('#screen').triggerHandler('cli-busy');
		}
		else if (!working && this._spinnerTimeout)
		{
			clearInterval(this._spinnerTimeout);
			this._spinnerTimout = null;
			$('#spinner').fadeOut();
			this.setPromptActive(true);
			$('#screen').triggerHandler('cli-ready');
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

$(document).ready(function() {
	$('#welcome').show();
	
	Terminal.init();
});