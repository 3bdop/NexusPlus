using UnityEngine;
using TMPro;
// using TMPro; // Ensure you have TextMeshPro namespace

public class BotGreeter : MonoBehaviour
{
    public float greetingDistance = 5.0f; // Distance to trigger greeting
    public string greetingMessage = "Welcome to the event!"; // Lyrics to display
    public AudioClip greetingAudio; // Audio clip for greeting
    public TextMeshProUGUI textDisplay; // Reference to TextMeshPro for lyrics

    private GameObject player; // Player avatar reference
    private AudioSource audioSource; // Audio source component

    void Start()
    {
        // Find the player in the scene (adjust tag as needed)
        player = GameObject.FindGameObjectWithTag("Player");

        // Add or get AudioSource component
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.clip = greetingAudio;
        audioSource.playOnAwake = false;

        // Ensure TextMeshPro object is hidden at the start
        if (textDisplay != null)
        {
            textDisplay.text = "";
        }
    }

    void Update()
    {
        if (player != null)
        {
            float distance = Vector3.Distance(transform.position, player.transform.position);
            if (distance <= greetingDistance && !audioSource.isPlaying)
            {
                GreetPlayer();
            }
        }
    }

    void GreetPlayer()
    {
        // Play audio and show the greeting message
        audioSource.Play();

        if (textDisplay != null)
        {
            textDisplay.text = greetingMessage;
            Invoke("HideText", audioSource.clip.length); // Hide text after the audio ends
        }
    }

    void HideText()
    {
        if (textDisplay != null)
        {
            textDisplay.text = "";
        }
    }
}
