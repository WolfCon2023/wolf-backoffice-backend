import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(response.data);
      } catch (error) {
        alert("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchAppointments();
  }, [navigate]);

  return (
    <div>
      <h1>Appointments</h1>
      <ul>
        {appointments.map((appt, index) => (
          <li key={index}>{appt.title} - {appt.date}</li>
        ))}
      </ul>
    </div>
  );
};

export default Appointments;
