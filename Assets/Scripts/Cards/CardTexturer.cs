using System.Collections;
using System.Collections.Generic;
using UnityEngine;
[System.Serializable]
public class CardTexturer : MonoBehaviour
{
    // Start is called before the first frame update
    public int value = 0;
    public int suit = 0;
    /*
     *spade = 0
     *clubs = 1
     *diamonds = 2
     *hearts = 3
     */
    public bool isJoker = false;
    void Start()
    {
        AssignTexture();
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public void AssignTexture()
    {
         transform.GetChild(0).GetComponent<MeshRenderer>().material = Resources.Load<Material>("Deck/Back");
        string path = "Deck/";
        if (isJoker)
        {
            path = path + "JOKER";
            switch (suit)
            {
                case 0:
                    path = path + "-1";
                    break;
                case 2:
                    path = path + "-2";
                    break;
            }
        }
        else
        {
            switch (suit)
            {
                case 0:
                    path = path + "SPADES-";
                    break;
                case 1:
                    path = path + "CLUBS-";
                    break;
                case 2:
                    path = path + "DIAMONDS-";
                    break;
                case 3:
                    path = path + "HEARTS-";
                    break;
            }
            path = path + value;
        }
        Debug.Log(path);
        transform.GetChild(1).GetComponent<MeshRenderer>().material = Resources.Load<Material>(path);
    }
}
