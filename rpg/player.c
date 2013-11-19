#include <stdio.h>
#include <string.h>
#include <math.h>
#include <string.h>
#include "person.h"

//Creates the player on a new game
void initialize(Player* player)
{
	player->maxHP = 30;
	player->currentHP = player->maxHP;
	player->experience = 0;
	player->level = 1;
	
	player->chance = .05;
	player->baseDamage = 5;
	
	printf("\nWhat is your name?\n\n> ");
	fgets(player->name, 80, stdin);
	player->name[strlen(player->name)-1] = '\0';
	
	printf("\nWelcome, %s!\n", player->name);
}

//Returns true if it was successfully loaded, false otherwise
int load(Player* player)
{
	FILE* inFile;
	inFile = fopen("data.txt", "r");
	if (inFile == NULL)
	{
		printf("Error loading file.\n");
		return 0;
	}
	fgets(player->name, 80, inFile);
	if (player->name[strlen(player->name)-1] == '\n')
		player->name[strlen(player->name)-1] = '\0';
	
	fscanf(inFile, "%d/%d\n", &(player->currentHP), &(player->maxHP));
	fscanf(inFile, "%d %d\n", &(player->experience), &(player->level));
	fscanf(inFile, "%d %d\n", &(player->X), &(player->Y));
	fscanf(inFile, "%lf %lf\n", &(player->chance), &(player->baseDamage));
	
	fclose(inFile);
	
	printf("%s's data was loaded successfully!\n", player->name);
	printf("\nWelcome back, %s!\n", player->name);
	return 1;
}

//Saves the player data to file
void save(Player player)
{
	FILE* saveFile;
	saveFile = fopen("data.txt", "w");
	fprintf(saveFile, "%s\n", player.name);
	fprintf(saveFile, "%d/%d\n", player.currentHP, player.maxHP);
	fprintf(saveFile, "%d %d\n", player.experience, player.level);
	fprintf(saveFile, "%d %d\n", player.X, player.Y);
	fprintf(saveFile, "%.3lf %.3lf", player.chance, player.baseDamage);
	
	fclose(saveFile);

	printf("File saved successfully!\n");
}

//Move the player and call probability to fight
void move(Player* player, int X, int Y)
{
	player->X += X;
	player->Y += Y;
	
	if (player->X > 100)
		player->X = -100;
	if (player->X < -100)
		player->X = 100;
	
	if (rand()%10 > 6)
	{
		enemyEncounter(player);
	}
}

//Options presented when an enemy is met by the player
void enemyEncounter(Player* player)
{
	Player enemy = createNPC(*player, sqrt(((player->X)*(player->X))+((player->Y)*(player->Y))));
	char prompt[30];
	int fightOver = 0;
	printf("\nA level %d ", enemy.level);
	printf("%s ", enemy.name);
	printf("is encountered!\n");
	
	do
	{	printf("What would you like to do? [Fight/Run/Inspect]\n\n> ");
		fgets(prompt, 30, stdin);
		prompt[strlen(prompt)-1] = '\0';
		lower(prompt);
		
		if (strcmp(prompt, "fight") == 0)
		{
			fight(player, &enemy);
			fightOver = 1;
		}
		else if (strcmp(prompt, "inspect") == 0)
		{
			printStats(enemy);
		}
		else if (strcmp(prompt, "run") == 0)
		{
			printf("You ran from the level %d %s.\n", enemy.level, enemy.name);
			fightOver = 1;
		}
		else
		{
			printf("What?\n");
		}
	} while (fightOver != 1);
}

//Battle code
void fight(Player* player, Player* enemy)
{
	printf("%s\tvs\t%s\n", player->name, enemy->name);
	printf("%d/%d\t\t%d/%d\n", player->currentHP, player->maxHP, enemy->currentHP, enemy->maxHP);
		
	do
	{
		//Player attacks
		
		//If enemy doesn't block
		if (rand()%100 > (enemy->chance)*100)
		{
			//If crit chance
			if (rand()%100 < (player->chance)*100)
			{
				printf("%s got a critical hit!\n", player->name);
				applyDamage(enemy, 1.5*player->baseDamage);
			}
			else
			{
				applyDamage(enemy, player->baseDamage);
			}
		}
		else
			printf("%s blocked the attack!\n", player->name);
		pause(1);
		//Enemy attacks
		
		//If player doesn't block
		if (rand()%100 > (player->chance)*100)
		{
			//If crit chance
			if (rand()%100 < (enemy->chance)*100)
			{
				applyDamage(player, 1.5*enemy->baseDamage);
				printf("The %s got a critical hit!\n", enemy->name);
			}
			else
			{
				applyDamage(player, enemy->baseDamage);
			}
		}
		else
			printf("The %s blocked the attack!\n", enemy->name);
		pause(1);
		printf("%d/%d\t\t%d/%d\n", player->currentHP, player->maxHP, enemy->currentHP, enemy->maxHP);
		
		
	} while (isDead(*player) != 1 && isDead(*enemy) != 1);
	
	if (isDead(*player))
	{
		printf("You died a very painful death.\n");
		player->X = 0;
		player->Y = 0;
		player->currentHP = player->maxHP;
		pause(3);
		printf("Somehow, you're alive again back where you started.\n");
	}
	else if (isDead(*enemy))
	{
		onFightWin(player, *enemy);
	}
}

//If the player wins the fight, then experience is applied
void onFightWin(Player* player, Player NPC)
{
	//Experience formula
	int exp = (int)sqrt(240*NPC.level + NPC.maxHP);
	printf("\nYou won the fight and gained %d experience.", exp);
	player->experience += exp;
	
	//Level up
	if (canLevelUp(player))
	{
		levelUp(player);
	}
}

//Modifies stats of player on level up
void levelUp(Player* player)
{
	player->level++;

	player->maxHP += sqrt(player->level);
	player->currentHP = player->maxHP;
	
	player->chance += player->level*.001;
	player->baseDamage += sqrt(player->level*2);

	printf("\nCongratulations! You are now level %d.", player->level);
}

//Finds out if the player has enough XP to level up.
//Algorithm used is from Runescape's leveling system.
int canLevelUp(Player * player)
{
	double netXP = 300;
	double i;
	for (i=1.0; i<player->level; i=i+1.0)
	{
		netXP+=(i+300*pow(2.0, (i/7.0)));
	}
	netXP*=.25;
	
	if (player->experience > netXP)
		return 1;
	return 0;
}

//Print stats of player or enemy
void printStats(Player player)
{
	printf("\n%s's stats: \n", player.name);
	printf("HP:\t%d/%d\n", player.currentHP, player.maxHP);
	printf("XP:\t%d\nLevel:\t%d\n", player.experience, player.level);
	printf("Location: ");
	if (player.Y < 0)
		printf("%d N, ", -1*player.Y);
	else if (player.Y > 0)
		printf("%d S, ", player.Y);
	else if (player.Y == 0)
		printf("0, ");
	if (player.X < 0)
		printf("%d W\n", -1*player.X);
	else if (player.X > 0)
		printf("%d E\n", player.X);
	else if (player.X == 0)
		printf("0\n");
	printf("Damage:\t%.2lf\n", player.baseDamage);
}

//Returns true if the player has less than 1 hit point
int isDead(Player player)
{
	if (player.currentHP <= 0)
		return 1;
	else
		return 0;
}

//Apply the damage to the attacked player/NPC
void applyDamage(Player* player, double damage)
{
	player->currentHP -= damage;
	if (player->currentHP < 0)
		player->currentHP = 0;
}

//Create enemy with difficulty based on current player level and distance from origin
Player createNPC(Player player, double distance)
{
	Player enemy;
	char enemyName[50];
	
	enemy.X = player.X;
	enemy.Y = player.Y;
	
	enemy.level = player.level 
					+ (rand()%(1+(int)distance)) 
					- (rand()%(1+(int)(sqrt(200)-distance)));
					
	if (enemy.level > 100)
		enemy.level = 100;
	if (enemy.level < 1)
		enemy.level = 1;
		
	if (enemy.Y > 70 || enemy.Y < -70)
		getSpecialName(enemyName);
	else
		getName(enemyName, enemy.level);
	strcpy(enemy.name, enemyName);
	
	enemy.experience = 0;
	
	enemy.maxHP = 30+enemy.level*sqrt(enemy.level+1)-rand()%(enemy.level+1);
	enemy.currentHP = enemy.maxHP;
	
	enemy.chance = .01*(rand()%(1+enemy.level))/2;
	enemy.baseDamage = 3.0+enemy.level*sqrt(rand()%(enemy.level+1));
	
	return enemy;
}