using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CardMovement : MonoBehaviour
{
    public int movementType = 0; // 0 - teleport, 1 - drag
    public bool simulation = false;
    public bool cardSelected = false;
    private GameManager game;
    private Renderer frontRenderer;

    // Start is called before the first frame update
    void Start()
    {
        game = GameObject.FindGameObjectWithTag("GameManager").GetComponent<GameManager>();
        frontRenderer = gameObject.transform.Find("Back").GetComponent<Renderer>();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private void OnMouseDown()
    {
        if((game.state == GameManager.GameState.FIRST_ATTACK || game.state == GameManager.GameState.SECONDARY_ATTACK) && game.attacker == game.playerIDs[0])
        {
            cardSelected = true;
            frontRenderer.material.SetColor("_Color", new Color(0.6f, 0.6f, 1.0f));
            game.playerSelectedCard = gameObject;
        }
    }

#if simulation
    
#endif
}
