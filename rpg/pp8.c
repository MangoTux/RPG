/*	Carson Noble
	cmnoble@iastate.edu
	CprE Section D
	Programming Practice 8

	Reflection 1: What were you trying to learn or achieve?
					I was trying to create a free-roam text-based RPG, while also learning about File IO with saving and loading data,
					string manipulation, structures, and multiple files for one program.
	Reflection 2: Were you successful? Why or why not?
					I'd say I was. I managed to create the game with (I hope) relatively few bugs, and in a lot less time than I thought.
	Reflection 3: Would you do anything differently if starting this over? If so, explain what.
					I don't think I would. I'm happy with what I was able to make, and it's a fun game to play.
	Reflection 4: Think about the most important thing you learned when writing this piece of code. What was it and explain why it was significant.
					I learned how important it is to keep functions short and focused. It makes for a lot more readable code, and is easier to debug.
	Other questions/comments for instructors:
					There are multiple files in here, which means compilation needs to run with gcc Noble_Carson_PP8.c player.c -o RPG; ./RPG
					Please let me know if you'd prefer single-file programs. This could have been done in one file, but I felt it would be more
					readable this way.
*/

#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "player.h"

#define FILE_SIZE 10;

void printAbout();
void printHelp();
void playGame(Player);
void lower(char*);
void pause(int);
void getName(char*, int);
void getSpecialName(char*);

int main()
{
	srand(time(NULL));
	char prompt[10];
	Player player;
	
	do
	{
		printf("\nrpg the rpg - an mmorpg\n\n");
		printf("> New\n> Load\n> About\n> Quit\n\n> ");
		fgets(prompt, 10, stdin);
		prompt[strlen(prompt)-1] = '\0';
		lower(prompt);
		if (strcmp(prompt, "new") == 0)
		{
			initialize(&player);
			playGame(player);
		}
		if (strcmp(prompt, "load") == 0)
		{
			if (load(&player))
				playGame(player);
			else
				continue;
		}
		if (strcmp(prompt, "about") == 0)
		{
			printAbout();
		}
	} while (strcmp(prompt, "quit") != 0);
}

void playGame(Player player)
{
	char prompt[30];
	printf("Type 'help' at any time to view a list of commands.\n");
	do
	{
		printf("\n> ");
		fgets(prompt, 30, stdin);
		prompt[strlen(prompt)-1] = '\0';
		lower(prompt);
		printf("\n");
		//todo: Switch to lower case
		if (strcmp(prompt, "help") == 0)
			printHelp();
		else if (strcmp(prompt, "rest") == 0)
		{
			player.currentHP = player.maxHP;
			printf("You feel rested.\n");
		}
		else if (strcmp(prompt, "stats") == 0)
			printStats(player);
		else if (strcmp(prompt, "go north") == 0)
		{
			if (player.Y == -100)
				printf("You can't go any farther north! ");
			else
			{
				printf("You head north. ");
				move(&player, 0, -1);
			}
			if (player.Y < -70 || player.Y > 70)
				printf("\nIt is cold outside.");
			printf("\n");
		}
		else if (strcmp(prompt, "go south") == 0)
		{
			if (player.Y == 100)
				printf("You can't go any farther south! ");
			else
			{
				printf("You head south. ");
				move(&player, 0, 1);
			}
			if (player.Y < -70 || player.Y > 70)
				printf("\nIt is cold outside.");
			printf("\n");
		}
		else if (strcmp(prompt, "go east") == 0)
		{
			printf("You head east. ");
			move(&player, 1, 0);
			if (player.X == -100)
				printf("You went so far east you're now west!");
			printf("\n");
		}
		else if (strcmp(prompt, "go west") == 0)
		{
			printf("You head west. ");
			move(&player, -1, 0);
			if (player.X == 100)
				printf("You went so far west you're now east!");
			printf("\n");
		}
		else if (strcmp(prompt, "save") == 0)
			save(player);
		else if (strcmp(prompt, "quit") == 0)
			break;
		else
			printf("What?\n");
	} while (strcmp(prompt, "quit") != 0);
}

//Set string to lowercase for input processing
void lower(char* s)
{
	int i;
	for (i=0; i<strlen(s); i++)
	{
		s[i] = tolower(s[i]);
	}
}

//Print the about page of the game. I'm sorry.
void printAbout()
{
	printf("RPG the RPG is an MMORPG (Manual Monoplayer Offline Role-Playing Game)\n");
	printf("in which all you do is fight stuff and walk around. That's it. It's kinda\n");
	printf("hard to do anything else without a GUI. Seriously. I mean, I could make\n");
	printf("some ASCII people that fight each other, but that'd be a lot of work. I\n");
	printf("mean, writing this was a lot of work, but that would be unnecessary work\n");
	printf("without much pay off. Plus, trying to get any decent formatting in C is \n");
	printf("really hard. I tried making this cool title thing with the different menu\n");
	printf("options, but I finally settled on just having the menu and the person types\n");
	printf("what they want to do. Really, this program isn't to learn how to print stuff.\n");
	printf("That was back in the first week of class. What I was actually trying to do\n");
	printf("was learn about file IO and a few other things, like structs and multiple\n");
	printf("source and header files. I wasn't really sure what to do that would encompass\n");
	printf("all of that, until I saw my roommate playing Runescape (instead of going to\n");
	printf("classes. That's a bad thing. He should be going to classes.), and then this\n");
	printf("idea came to me. Have you ever played Runescape? I used to back in 2007-2008.\n");
	printf("It was pretty fun. I spent a lot of time playing it, though. They've made a\n");
	printf("lot of changes to it since then. It's kinda confusing now. Are you still reading\n");
	printf("this? You don't have to. I'm just typing while I figure out how I should write\n");
	printf("some of this code. When I first started doing this, I thought it would be easy\n");
	printf("to make a text-based RPG. I was wrong. The concepts are solid, but implementing\n");
	printf("everything is actually a bit difficult. Not to mention working on the damage,\n");
	printf("health, XP and leveling algorithms. I actually used Runescape's level up code\n");
	printf("in this. It works out pretty nicely, using calculus and everything. I like \n");
	printf("calculus. We get to draw a lot of funny letters. We don't even use numbers\n");
	printf("any more. That's weird to think about. Doing math without numbers? Crazy.\n");
	printf("You know, you could be doing something else than reading this, like playing\n");
	printf("the game that comes with this. Actually, this text comes with the game. You\n");
	printf("should definitely play it instead of playing Wall of Text: The Game.\n");
}

void printHelp()
{
	printf("Commands:\n");
	printf("\tGo north - Move north\n");
	printf("\tGo south - Move south\n");
	printf("\tGo east  - Move east\n");
	printf("\tGo west  - Move west\n");
	printf("\tRest     - Rest and regain HP\n");
	printf("\tStats    - Print your character's stats\n");
	printf("\tHelp     - Print this help page\n");
	printf("\tSave     - Save your character's progress\n");
	printf("\tQuit     - Exit game. Make sure to save!\n");
}

void pause(int sec)
{
	int returnTime = time(0) + sec;
	while (time(0) < returnTime) ; //Wait until delay is over;
}

//Gets name of NPC
void getName(char* name, int level)
{
	int terminal = (level/5)+rand()%5;
	int i;
	FILE* nameFile;
	nameFile = fopen("names.txt", "r");
	if (nameFile == NULL)
	{
		strcpy(name, "NPC");
		return;
	}
	
	for (i=0; i<terminal; i++)
	{
		fscanf(nameFile, "%s", name);
	}
	fclose(nameFile);
}

//For use in winter areas - |Y| > 70
void getSpecialName(char* name)
{
	int terminal = 25+rand()%5;
	int i;
	FILE* nameFile;
	nameFile = fopen("names.txt", "r");
	if (nameFile == NULL)
	{
		strcpy(name, "Frozen NPC");
		return;
	}
	for (i=0; i<terminal; i++)
	{
		fscanf(nameFile, "%s", name);
	}
	fclose(nameFile);
}