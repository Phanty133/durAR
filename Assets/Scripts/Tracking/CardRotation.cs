using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

public class CardRotation : MonoBehaviour
{
    private Transform camTransform;
    public Vector3 camPos0;
    private float lerpStart;
    private bool lerpToNewPos = false;
    public float lerpTime = 0.25f;
    public Vector3 posRelativeToCam;
    private Vector3 oldPos;
    private Vector3 prevCamAngle;

    public bool rotLockX = false;
    public bool rotLockY = false;
    public bool rotLockZ = false;

    private Vector3 averageCamPos;
    public int baseAverageFrames = 30; // How many frames to average for camera position
    public float averageFrameScaling = 1.1f; // How much the average frames increase for every 1 unit of distance from camPos to 0,0,0 
    private List<Vector3> camPosList = new List<Vector3>();

    private int averageFrames;
    private Text angleText;

    // Start is called before the first frame update
    void Start()
    {
        camTransform = GameObject.FindGameObjectWithTag("MainCamera").transform;
        averageFrames = baseAverageFrames;
        angleText = GameObject.Find("CardAngleText").GetComponent<Text>();
    }

    // Update is called once per frame
    void Update()
    {
        // Average out the frames to filter out random sharp movements

        if(camPosList.Count < averageFrames)
        {
            camPosList.Add(camTransform.position);
            averageCamPos = (averageCamPos * (camPosList.Count - 1) + camTransform.position) / camPosList.Count;
        }
        else
        {
            Vector3 oldestPos = camPosList[0];
            camPosList.RemoveAt(0);
            camPosList.Add(camTransform.position);

            averageCamPos = (averageCamPos * averageFrames - oldestPos + camTransform.position) / averageFrames;
        }

        // Make card faces follow the camera

        Vector3 oldAngles = transform.eulerAngles;

        if (oldAngles.y == 180) oldAngles.y = 0;
        if (oldAngles.z == 180) oldAngles.z = 0;

        gameObject.transform.Find("PlayerCards").transform.LookAt(averageCamPos);

        transform.eulerAngles = new Vector3(
            rotLockX ? oldAngles.x : transform.eulerAngles.x,
            rotLockY ? oldAngles.y : camTransform.eulerAngles.y,
            rotLockZ ? oldAngles.z : transform.eulerAngles.z
        );

        angleText.text = "Card angle: " + transform.eulerAngles.ToString();

        // Update card position relative to camera

        Vector3 newPos = averageCamPos + posRelativeToCam;

        if (Vector3.Distance(transform.position, newPos) > 0.05f || camTransform.eulerAngles != prevCamAngle) 
        {
            averageFrames = Mathf.FloorToInt(baseAverageFrames + averageFrameScaling * averageCamPos.magnitude);

            /*float alpha = camTransform.eulerAngles.y;

            float targetX = cardDist * Mathf.Sin(alpha * (Mathf.PI / 180));
            float targetY = cardDist * Mathf.Cos(alpha * (Mathf.PI / 180));

            Debug.Log(alpha);

            newPos = new Vector3(newPos.x, newPos.y, newPos.z);*/

            if (!lerpToNewPos)
            {
                lerpStart = Time.time;
                lerpToNewPos = true;
                oldPos = transform.position;
            }

            transform.position = Vector3.Lerp(oldPos, newPos, Time.time / (lerpStart + lerpTime));
        }
        else
        {
            lerpToNewPos = false;
        }

        prevCamAngle = camTransform.eulerAngles;
    }
}
