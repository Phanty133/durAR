using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class camPos : MonoBehaviour
{
    private Text text;
    private Transform camTransform;

    // Start is called before the first frame update
    void Start()
    {
        text = GetComponent<Text>();
        camTransform = GameObject.FindGameObjectWithTag("MainCamera").transform;
    }

    // Update is called once per frame
    void Update()
    {
        text.text = "CamPos: " + camTransform.position.ToString();
    }
}
