using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public enum GameState
    {
        FIRST_ATTACK,
        SECONDARY_ATTACK,
        DEFENSE,
        PASS,
        TAKE,
        IDLE
    }

    public int attacker;
    public int defender;
    public GameState state;
    public int[] playerIDs;
    public bool simulation = false;
    public GameObject playerSelectedCard;

    // Start is called before the first frame update
    void Start()
    {
        state = GameState.FIRST_ATTACK;
        playerIDs = new int[4]; // Index 0 - Main player, 1 - Left, 2 - Top, 3 - Right
        
        foreach(GameObject card in GameObject.FindGameObjectsWithTag("card"))
        {
            //card.GetComponent<CardMovement>().simulation = simulation;
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
