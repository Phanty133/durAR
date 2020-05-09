using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Vuforia;

public class PlayArea : MonoBehaviour
{
    private GameManager game;
    private Camera cam;
    public List<GameObject[]> cards = new List<GameObject[]>();

    // Start is called before the first frame update
    void Start()
    {
        game = GameObject.FindGameObjectWithTag("GameManager").GetComponent<GameManager>();
        cam = GameObject.FindGameObjectWithTag("MainCamera").GetComponent<Camera>();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private void OnMouseDown()
    {
        if (game.playerSelectedCard)
        {
            if(game.state == GameManager.GameState.FIRST_ATTACK || game.state == GameManager.GameState.SECONDARY_ATTACK)
            {
                GameObject[] stack = { game.playerSelectedCard, null };
                cards.Add(stack);

                GameObject stackObj = Instantiate(new GameObject(), transform);
                game.playerSelectedCard.transform.SetParent(stackObj.transform);

                RaycastHit hit;
                Ray clickRay = cam.ScreenPointToRay(Input.mousePosition);

                if (Physics.Raycast(clickRay, out hit))
                {
                    game.playerSelectedCard.transform.position = hit.point;
                }
            }

            game.playerSelectedCard.transform.eulerAngles = new Vector3(90, 0, Random.Range(-1, 1) * 30);
        }
    }
}
