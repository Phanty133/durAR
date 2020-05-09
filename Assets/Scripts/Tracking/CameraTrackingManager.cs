using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class CameraTrackingManager : MonoBehaviour
{
    public void SetInitialCameraPos()
    {
        Vector3 camPos = GameObject.FindGameObjectWithTag("MainCamera").transform.position;
        GameObject.FindGameObjectWithTag("MainPlayerDeck").GetComponent<CardRotation>().camPos0 = camPos;

        GameObject.Find("Cam0").GetComponent<Text>().text = "Cam pos0: " + camPos.ToString();
    }
}
