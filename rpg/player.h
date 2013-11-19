#ifndef PLAYER_H
#define PLAYER_H

#include <stdio.h>
#include <math.h>
#include <stdlib.h>

typedef struct Player
{
	char name[80];
	
	int currentHP;
	int maxHP;
	int experience;
	int level;
	
	int X, Y;
	
	double chance;
	double baseDamage;
	
} Player;

void initialize(Player*);
int  load(Player*);
void save(Player);

void move(Player*, int, int);

void enemyEncounter(Player*);
void fight(Player*, Player*);

void onFightWin(Player*, Player);
void levelUp(Player*);
int  canLevelUp(Player*);

void printStats(Player);

int  isDead(Player);

void applyDamage(Player*, double);

Player createNPC(Player, double);

#endif